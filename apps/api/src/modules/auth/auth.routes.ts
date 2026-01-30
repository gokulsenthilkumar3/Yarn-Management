import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { loginSchema } from './auth.schemas';
import { login, logout, refresh } from './auth.service';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/auth',
};

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body.email, body.password);

    res.cookie('refresh_token', result.refreshToken, {
      ...cookieOptions,
      expires: result.refreshExpiresAt,
    });

    return res.json({ accessToken: result.accessToken });
  } catch (e) {
    return next(e);
  }
});

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const result = await refresh(token);

    res.cookie('refresh_token', result.refreshToken, {
      ...cookieOptions,
      expires: result.refreshExpiresAt,
    });

    return res.json({ accessToken: result.accessToken });
  } catch (e) {
    return next(e);
  }
});

authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    await logout(token);
    res.clearCookie('refresh_token', cookieOptions);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

const forgotSchema = z.object({ email: z.string().email() });

authRouter.post(
  '/forgot-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      forgotSchema.parse(req.body);
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  }
);

// --- MFA ---

import { authenticate } from '../../middleware/authenticate';
import {
  setupMfa,
  enableMfa,
  validateMfa,
} from './auth.service';

authRouter.post('/mfa/setup', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await setupMfa(req.userId!);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
});

authRouter.post('/mfa/enable', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, secret } = z.object({ token: z.string(), secret: z.string() }).parse(req.body);
    await enableMfa(req.userId!, token, secret);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

authRouter.post('/mfa/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, token } = z.object({ userId: z.string(), token: z.string() }).parse(req.body);
    const valid = await validateMfa(userId, token);
    if (!valid) return res.status(401).json({ message: 'Invalid MFA code' });
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});
