import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { recordAuditLog, AuditAction } from '../../utils/audit';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, status: true, createdAt: true },
  });

  return res.json({ user });
});

usersRouter.get(
  '/',
  authenticate,
  requirePermission('users.read'),
  async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ users });
  }
);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(12),
  roleCodes: z.array(z.string().min(1)).default([]),
});

usersRouter.post(
  '/',
  authenticate,
  requirePermission('users.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createUserSchema.parse(req.body);

      const passwordHash = await bcrypt.hash(body.password, 10);

      const roles = await prisma.role.findMany({
        where: { code: { in: body.roleCodes } },
        select: { id: true },
      });

      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash,
          roles: {
            create: roles.map((r: { id: string }) => ({ roleId: r.id })),
          },
        },
        select: { id: true, email: true, name: true, status: true, createdAt: true },
      });

      return res.status(201).json({ user });
    } catch (e) {
      return next(e);
    }
  }
);
// --- IP Whitelisting (Task 28) ---

usersRouter.get('/me/security', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { allowedIPs: true, trustedDevices: true }
  });
  return res.json({ security: user });
});

usersRouter.patch('/me/ip-whitelist', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ips } = z.object({ ips: z.array(z.string()) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { allowedIPs: ips },
      select: { allowedIPs: true }
    });

    await recordAuditLog(AuditAction.IP_WHITELIST_UPDATE, {
      userId: req.userId,
      metadata: { ips },
      ip: req.ip,
      userAgent: req.header('user-agent')
    });
    return res.json({ allowedIPs: user.allowedIPs });
  } catch (e) {
    return next(e);
  }
});

// --- Device Management (Task 28) ---

usersRouter.delete('/me/devices/:deviceId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    await prisma.trustedDevice.delete({
      where: {
        id: deviceId, // Assuming ID is passed, not deviceId (uuid)
        userId: req.userId
      }
    });

    await recordAuditLog(AuditAction.DEVICE_REVOKED, {
      userId: req.userId,
      metadata: { deviceId },
      ip: req.ip,
      userAgent: req.header('user-agent')
    });
    return res.json({ message: 'Device revoked' });
  } catch (e) {
    return next(e);
  }
});
