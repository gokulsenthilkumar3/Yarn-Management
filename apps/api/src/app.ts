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
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { searchRouter } from './modules/search/search.routes';
import importRouter from './modules/import/import.routes';
import { qualityControlRouter } from './modules/quality-control/quality-control.routes';
import { procurementRouter } from './modules/procurement/procurement.routes';
import { portalRouterExport } from './modules/portal/portal.routes';
import { planningRouter } from './modules/production/planning.routes';
import { machineRouter } from './modules/production/machine.routes';
import { warehouseRouter } from './modules/inventory/warehouse.routes';
import optimizationRouter from './modules/inventory/optimization.routes';
import reconciliationRouter from './modules/inventory/reconciliation.routes';
import { arRouter } from './modules/ar/ar.routes';
import { apRouter } from './modules/ap/ap.routes';
import { budgetRouter } from './modules/ap/budgets.routes';
import { demandForecastingRouter } from './modules/demand-forecasting/demand-forecasting.routes';
import { qualityPredictionRouter } from './modules/quality-prediction/quality-prediction.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  // Application Entry Point
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

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/', importRouter);
  app.use('/users', usersRouter);
  app.use('/suppliers', suppliersRouter);
  app.use('/raw-materials', rawMaterialsRouter);
  app.use('/manufacturing', manufacturingRouter);
  app.use('/billing', billingRouter);
  app.use('/finished-goods', finishedGoodsRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/notifications', notificationRouter);
  app.use('/search', searchRouter);
  app.use('/quality-control', qualityControlRouter);
  app.use('/procurement', procurementRouter);
  app.use('/portal', portalRouterExport);
  app.use('/production', planningRouter);
  app.use('/production', machineRouter);
  app.use('/inventory', warehouseRouter);
  app.use('/inventory/optimization', optimizationRouter);
  app.use('/inventory/reconciliation', reconciliationRouter);
  app.use('/ar', arRouter);
  app.use('/ap', apRouter);
  app.use('/ap/budgets', budgetRouter);
  app.use('/demand-forecasting', demandForecastingRouter);
  app.use('/quality-prediction', qualityPredictionRouter);

  app.use(errorHandler);

  return app;
}
