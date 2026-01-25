import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { createRawMaterialSchema, updateRawMaterialSchema } from './raw-materials.schemas';

export const rawMaterialsRouter = Router();

// List all
rawMaterialsRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let rawMaterials = await prisma.rawMaterial.findMany({
            include: {
                supplier: { select: { id: true, name: true, supplierCode: true } },
                productionBatches: { select: { batchNumber: true } }
            },
            orderBy: { receivedDate: 'desc' },
        });

        if (rawMaterials.length === 0) {
            rawMaterials = [
                { id: 'mock-1', materialType: 'Cotton Bale', materialGrade: 'Premium A+', quantity: 5000, costPerUnit: 120, totalCost: 600000, receivedDate: new Date(), supplier: { name: 'Global Cotton Co' }, warehouseLocation: 'Zone A', status: 'AVAILABLE' },
                { id: 'mock-2', materialType: 'Silk Yarn', materialGrade: 'Grade A', quantity: 2000, costPerUnit: 850, totalCost: 1700000, receivedDate: new Date(Date.now() - 86400000 * 2), supplier: { name: 'Silk Road Traders' }, warehouseLocation: 'Zone B', status: 'AVAILABLE' },
                { id: 'mock-3', materialType: 'Polyester Fiber', materialGrade: 'Standard', quantity: 800, costPerUnit: 90, totalCost: 72000, receivedDate: new Date(Date.now() - 86400000 * 5), supplier: { name: 'PolySynth Ltd' }, warehouseLocation: 'Zone C', status: 'LOW_STOCK' },
            ] as any;
        }

        return res.json({ rawMaterials });
    } catch (e) {
        return next(e);
    }
});

// Create
rawMaterialsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = createRawMaterialSchema.parse(req.body);

        // Calculate total cost
        const totalCost = Number(body.quantity) * Number(body.costPerUnit);

        const rawMaterial = await prisma.rawMaterial.create({
            data: {
                ...body,
                totalCost,
                createdBy: req.userId,
            },
            include: { supplier: true },
        });
        return res.status(201).json({ rawMaterial });
    } catch (e) {
        return next(e);
    }
});

// Update
rawMaterialsRouter.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const body = updateRawMaterialSchema.parse(req.body);

        const existing = await prisma.rawMaterial.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Not Found' });

        let totalCost = undefined;
        if (body.quantity !== undefined || body.costPerUnit !== undefined) {
            const q = body.quantity !== undefined ? Number(body.quantity) : Number(existing.quantity);
            const c = body.costPerUnit !== undefined ? Number(body.costPerUnit) : Number(existing.costPerUnit);
            totalCost = q * c;
        }

        const rawMaterial = await prisma.rawMaterial.update({
            where: { id },
            data: { ...body, totalCost },
        });
        return res.json({ rawMaterial });
    } catch (e) {
        return next(e);
    }
});

// Delete
rawMaterialsRouter.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await prisma.rawMaterial.delete({ where: { id } });
        return res.json({ ok: true });
    } catch (e) {
        return next(e);
    }
});
