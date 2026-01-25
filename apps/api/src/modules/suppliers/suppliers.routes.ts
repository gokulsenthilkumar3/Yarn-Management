import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schemas';

export const suppliersRouter = Router();

function generateSupplierCode(): string {
  const prefix = 'SUP';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

suppliersRouter.get(
  '/',
  authenticate,
  requirePermission('suppliers.read'),
  async (_req: Request, res: Response) => {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json({ suppliers });
  }
);

suppliersRouter.get(
  '/:id',
  authenticate,
  requirePermission('suppliers.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const supplier = await prisma.supplier.findUnique({ where: { id } });
      if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
      return res.json({ supplier });
    } catch (e) {
      return next(e);
    }
  }
);

suppliersRouter.post(
  '/',
  authenticate,
  requirePermission('suppliers.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      const body = createSupplierSchema.parse(req.body);
      console.log('Parsed body:', JSON.stringify(body, null, 2));
      const payload = {
        ...body,
        supplierCode: body.supplierCode || generateSupplierCode(),
        // Defaults for mandatory DB fields to support legacy frontend
        supplierType: body.supplierType || 'Raw Cotton Waste Supplier',
        businessType: body.businessType || 'Trader',
        // Primary Contact - Use null if not provided (Schema now allows it)
        primaryContactName: body.primaryContactName || body.name, // Name is mandatory, so this is safe
        primaryContactMobile: body.primaryContactMobile || body.phone || null,
        primaryContactEmail: body.primaryContactEmail || body.email || null,

        // Address - Use null if not provided
        registeredAddressLine1: body.registeredAddressLine1 || body.address || null,
        registeredCity: body.registeredCity || null,
        registeredState: body.registeredState || null,
        registeredPinCode: body.registeredPinCode || null,
        registeredCountry: body.registeredCountry || null,
      };
      console.log('Final payload:', JSON.stringify(payload, null, 2));
      const supplier = await prisma.supplier.create({ data: payload });
      return res.status(201).json({ supplier });
    } catch (e: any) {
      console.error('Supplier creation error:', e.message || e);
      return next(e);
    }
  }
);

suppliersRouter.patch(
  '/:id',
  authenticate,
  requirePermission('suppliers.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      console.log('PATCH req.body:', JSON.stringify(req.body, null, 2));
      const body = updateSupplierSchema.parse(req.body);
      const updateData = {
        ...body,
        // Sync legacy fields with structured primary contact/address fields
        // We use !== undefined to allow null values to pass through
        ...(body.name !== undefined && { primaryContactName: body.name }),
        ...(body.phone !== undefined && { primaryContactMobile: body.phone }),
        ...(body.email !== undefined && { primaryContactEmail: body.email }),
        ...(body.address !== undefined && { registeredAddressLine1: body.address }),
      };

      console.log('PATCH updateData:', JSON.stringify(updateData, null, 2));
      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateData as any,
      });
      return res.json({ supplier });
    } catch (e) {
      return next(e);
    }
  }
);

suppliersRouter.delete(
  '/:id',
  authenticate,
  requirePermission('suppliers.delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.supplier.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  }
);
