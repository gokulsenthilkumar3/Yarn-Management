import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { suppliersRouter } from './modules/suppliers/suppliers.routes';
import { rawMaterialsRouter } from './modules/raw-materials/raw-materials.routes';
import { manufacturingRouter } from './modules/manufacturing/manufacturing.routes';
import { billingRouter } from './modules/billing/billing.routes';
import { finishedGoodsRouter } from './modules/finished-goods/finished-goods.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/suppliers', suppliersRouter);
  app.use('/raw-materials', rawMaterialsRouter);
  app.use('/manufacturing', manufacturingRouter);
  app.use('/billing', billingRouter);
  app.use('/finished-goods', finishedGoodsRouter);

  app.use(errorHandler);

  return app;
}
