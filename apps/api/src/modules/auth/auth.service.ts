import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';




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

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user.id);
  const refresh = signRefreshToken(user.id);

  const tokenHash = await hashToken(refresh.raw);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refresh.expiresAt,
    },
  });

  return { accessToken, refreshToken: refresh.raw, refreshExpiresAt: refresh.expiresAt };
}

export async function refresh(refreshToken: string) {
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

  await prisma.refreshToken.delete({ where: { id: match.id } });

  const accessToken = signAccessToken(userId);
  const newRefresh = signRefreshToken(userId);
  const tokenHash = await hashToken(newRefresh.raw);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: newRefresh.expiresAt,
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
