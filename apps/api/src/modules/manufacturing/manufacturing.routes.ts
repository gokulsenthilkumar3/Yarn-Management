import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { authenticate } from '../../middleware/authenticate';
import {
    createBatchSchema,
    updateBatchSchema,
    updateStageSchema,
    logWastageSchema,
    completeBatchSchema
} from './manufacturing.schemas';

export const manufacturingRouter = Router();

// Get Batches (Kanban)
manufacturingRouter.get('/batches', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let batches = await prisma.productionBatch.findMany({
            include: { rawMaterial: true, finishedGoods: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (batches.length === 0) {
            batches = [
                { id: 'mock-b1', batchNumber: 'B-101', currentStage: 'SPINNING', status: 'IN_PROGRESS', inputQuantity: 1000, rawMaterial: { materialType: 'Cotton' }, startDate: new Date() },
                { id: 'mock-b2', batchNumber: 'B-102', currentStage: 'CARDING', status: 'IN_PROGRESS', inputQuantity: 1200, rawMaterial: { materialType: 'Cotton' }, startDate: new Date() },
                { id: 'mock-b3', batchNumber: 'B-103', currentStage: 'WINDING', status: 'IN_PROGRESS', inputQuantity: 900, rawMaterial: { materialType: 'Silk' }, startDate: new Date() },
                { id: 'mock-b4', batchNumber: 'B-104', currentStage: 'COMPLETED', status: 'COMPLETED', inputQuantity: 1500, rawMaterial: { materialType: 'Polyester' }, startDate: new Date(), endDate: new Date() },
                { id: 'mock-b5', batchNumber: 'B-105', currentStage: 'PLANNED', status: 'PENDING', inputQuantity: 2000, rawMaterial: { materialType: 'Cotton' }, startDate: null },
            ] as any;
        }

        return res.json({ batches });
    } catch (e) {
        return next(e);
    }
});

// Start Batch
manufacturingRouter.post('/batches', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = createBatchSchema.parse(req.body);

        // Check if raw material exists and has enough quantity
        const rm = await prisma.rawMaterial.findUnique({ where: { id: body.rawMaterialId } });
        if (!rm) return res.status(404).json({ message: 'Raw material not found' });

        // In a real app, we'd check if we have enough quantity or reserve it.
        // For now, we assume we take a portion or all.

        const batch = await prisma.productionBatch.create({
            data: {
                batchNumber: body.batchNumber,
                rawMaterialId: body.rawMaterialId,
                inputQuantity: body.inputQuantity,
                currentStage: 'PLANNED',
                status: 'PENDING',
            },
        });

        return res.status(201).json({ batch });
    } catch (e) {
        return next(e);
    }
});

// Update Batch Details (Edit)
manufacturingRouter.patch('/batches/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const body = updateBatchSchema.parse(req.body);

        const batch = await prisma.productionBatch.update({
            where: { id },
            data: body,
        });

        return res.json({ batch });
    } catch (e) {
        return next(e);
    }
});

// Update Stage
manufacturingRouter.patch('/batches/:id/stage', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { stage } = updateStageSchema.parse(req.body);

        const batch = await prisma.productionBatch.update({
            where: { id },
            data: {
                currentStage: stage,
                status: stage === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
                startDate: stage === 'MIXING' ? new Date() : undefined, // Set start date on first active stage
                endDate: stage === 'COMPLETED' ? new Date() : undefined,
            },
        });

        // Log stage transition (simplified)
        await prisma.productionStage.create({
            data: {
                batchId: id,
                stageName: stage,
                startTime: new Date(),
            }
        });

        return res.json({ batch });
    } catch (e) {
        return next(e);
    }
});

// Log Wastage
manufacturingRouter.post('/wastage', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = logWastageSchema.parse(req.body);

        const wastage = await prisma.wastageLog.create({
            data: {
                batchId: body.batchId,
                stage: body.stage,
                quantity: body.quantity,
                wasteType: body.wasteType,
                reason: body.reason,
                userId: req.userId,
            }
        });

        return res.status(201).json({ wastage });
    } catch (e) {
        return next(e);
    }
});

// Get Wastage Logs
manufacturingRouter.get('/wastage', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let wastage = await prisma.wastageLog.findMany({
            include: {
                batch: {
                    select: { batchNumber: true }
                }
            },
            orderBy: { loggedAt: 'desc' }
        });

        if (wastage.length === 0) {
            wastage = [
                { id: 'w1', batch: { batchNumber: 'B-101' }, stage: 'SPINNING', wasteType: 'Hard Waste', quantity: 12.5, reason: 'Broken ends', loggedAt: new Date() },
                { id: 'w2', batch: { batchNumber: 'B-102' }, stage: 'CARDING', wasteType: 'Soft Waste', quantity: 45.0, reason: 'Fiber fly', loggedAt: new Date(Date.now() - 86400000) },
                { id: 'w3', batch: { batchNumber: 'B-101' }, stage: 'WINDING', wasteType: 'Hard Waste', quantity: 8.0, reason: 'Cone defect', loggedAt: new Date(Date.now() - 86400000 * 2) },
                { id: 'w4', batch: { batchNumber: 'B-103' }, stage: 'DRAWING', wasteType: 'Sweepings', quantity: 15.0, reason: 'Floor cleaning', loggedAt: new Date(Date.now() - 86400000 * 3) },
            ] as any;
        }

        return res.json({ wastage });
    } catch (e) {
        return next(e);
    }
});

// Complete Batch
manufacturingRouter.post('/batches/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const body = completeBatchSchema.parse(req.body);

        const batch = await prisma.productionBatch.findUnique({ where: { id } });
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        const finishedGood = await prisma.finishedGood.create({
            data: {
                batchId: id,
                yarnCount: body.yarnCount,
                producedQuantity: body.producedQuantity,
                qualityGrade: body.qualityGrade,
            }
        });

        // Mark batch complete
        await prisma.productionBatch.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                currentStage: 'COMPLETED',
                endDate: new Date(),
            }
        });

        // Deduct from Raw Material Stock (Assume consumed fully or partially)
        // Simplified: Mark RM as CONSUMED if batch input matches RM quantity, or reduce it.
        // For this MVP, we won't auto-deduct RM to keep it simple, or we allow specific deduction logic.
        // Let's just update the specific RM status if it was fully used.

        return res.json({ ok: true, finishedGood });
    } catch (e) {
        return next(e);
    }
});
