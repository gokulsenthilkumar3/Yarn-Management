import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { recordAuditLog, AuditAction } from '../../utils/audit';
import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';




function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, String(env.JWT_ACCESS_SECRET), {
    expiresIn: String(env.JWT_ACCESS_EXPIRES_IN) as any,
  });
}

function signRefreshToken(userId: string) {
  const expiresAt = new Date(Date.now() + daysToMs(env.JWT_REFRESH_EXPIRES_IN_DAYS));
  const raw = jwt.sign({ sub: userId }, String(env.JWT_REFRESH_SECRET), {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d` as any,
  });
  return { raw, expiresAt };
}

async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

async function verifyTokenHash(token: string, tokenHash: string) {
  return bcrypt.compare(token, tokenHash);
}

export async function login(email: string, password: string, ip?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      failedLoginAttempts: true,
      lockoutUntil: true
    },
  });

  if (!user || !user.passwordHash) {
    await recordAuditLog(AuditAction.LOGIN_FAILURE, { metadata: { email }, ip, userAgent });
    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (user.status === 'DISABLED') {
    await recordAuditLog(AuditAction.LOGIN_FAILURE, { userId: user.id, metadata: { reason: 'ACCOUNT_DISABLED' }, ip, userAgent });
    const err: any = new Error('Account disabled');
    err.status = 403;
    throw err;
  }

  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    await recordAuditLog(AuditAction.LOGIN_FAILURE, { userId: user.id, metadata: { reason: 'ACCOUNT_LOCKED' }, ip, userAgent });
    const err: any = new Error(`Account locked. Try again after ${user.lockoutUntil.toLocaleTimeString()}`);
    err.status = 403;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    const lockoutUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockoutUntil: lockoutUntil
      }
    });

    if (lockoutUntil) {
      await recordAuditLog(AuditAction.ACCOUNT_LOCKED, { userId: user.id, ip, userAgent });
    }

    await recordAuditLog(AuditAction.LOGIN_FAILURE, { userId: user.id, metadata: { attempts }, ip, userAgent });

    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Reset login failures on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockoutUntil: null }
  });

  await recordAuditLog(AuditAction.LOGIN_SUCCESS, { userId: user.id, ip, userAgent });

  // Device management
  if (userAgent) {
    await recordDeviceActivity(user.id, ip, userAgent);
  }

  return createSession(user.id, ip, userAgent);
}

async function recordDeviceActivity(userId: string, ip?: string, userAgent?: string) {
  if (!userAgent) return;

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const deviceName = `${browser.name || 'Unknown'} on ${os.name || 'Unknown'}`;

  // We'll use a simple deterministic "fingerprint" for now
  // In prod, use a more robust fingerprinting library or client-side permanent storage
  const deviceId = Buffer.from(`${userAgent}-${ip || 'unknown'}`).toString('base64');

  const existing = await prisma.trustedDevice.findUnique({
    where: { deviceId }
  });

  if (existing) {
    await prisma.trustedDevice.update({
      where: { id: existing.id },
      data: { lastUsed: new Date(), name: deviceName }
    });
  } else {
    await prisma.trustedDevice.create({
      data: {
        userId,
        deviceId,
        name: deviceName,
        lastUsed: new Date()
      }
    });
    // Here we could send an alert "New device logged in"
    console.log(`New trusted device registered for user ${userId}: ${deviceName}`);
  }
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  // Enforce session limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { maxSessions: true }
  });

  const maxSessions = user?.maxSessions || 5;

  const activeSessions = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  if (activeSessions.length >= maxSessions) {
    const sessionsToRemove = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
    await prisma.refreshToken.deleteMany({
      where: { id: { in: sessionsToRemove.map(s => s.id) } }
    });
  }

  const accessToken = signAccessToken(userId);
  const refresh = signRefreshToken(userId);

  const tokenHash = await hashToken(refresh.raw);
  await prisma.refreshToken.create({
    data: {
      userId: userId,
      tokenHash,
      expiresAt: refresh.expiresAt,
      ipAddress: ip,
      userAgent: userAgent,
      lastActive: new Date()
    },
  });

  return { accessToken, refreshToken: refresh.raw, refreshExpiresAt: refresh.expiresAt };
}

export async function refresh(refreshToken: string, ip?: string, userAgent?: string) {
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    const err: any = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const userId = decoded.sub as string;

  const candidates = await prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, tokenHash: true },
  });

  const match = await (async () => {
    for (const c of candidates) {
      const ok = await verifyTokenHash(refreshToken, c.tokenHash);
      if (ok) return c;
    }
    return null;
  })();

  if (!match) {
    const err: any = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  // Delete old token (rotate)
  await prisma.refreshToken.delete({ where: { id: match.id } });

  const accessToken = signAccessToken(userId);
  const newRefresh = signRefreshToken(userId);
  const tokenHash = await hashToken(newRefresh.raw);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: newRefresh.expiresAt,
      ipAddress: ip,
      userAgent: userAgent,
      lastActive: new Date()
    },
  });

  return { accessToken, refreshToken: newRefresh.raw, refreshExpiresAt: newRefresh.expiresAt };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    const userId = decoded.sub;

    const candidates = await prisma.refreshToken.findMany({
      where: { userId },
      select: { id: true, tokenHash: true },
    });

    for (const c of candidates) {
      const ok = await verifyTokenHash(refreshToken, c.tokenHash);
      if (ok) {
        await prisma.refreshToken.delete({ where: { id: c.id } });
        break;
      }
    }
  } catch {
    return;
  }
}

// ... existing helpers ...

export async function setupMfa(userId: string) {
  const secret = speakeasy.generateSecret({ length: 20, name: 'YarnManagement' });
  const url = await QRCode.toDataURL(secret.otpauth_url!);

  await recordAuditLog(AuditAction.MFA_DISABLED, { // Or call it MFA_SETUP_STARTED
    userId,
    metadata: { action: 'setup_initiated' }
  });

  return { secret: secret.base32, qrCode: url };
}

export async function enableMfa(userId: string, token: string, secret: string) {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    const err: any = new Error('Invalid OTP code');
    err.status = 400;
    throw err;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true, mfaSecret: secret },
  });

  await recordAuditLog(AuditAction.MFA_ENABLED, {
    userId,
    metadata: { method: 'TOTP' }
  });

  return true;
}

export async function validateMfa(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.mfaSecret) return false;

  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
  });
}
