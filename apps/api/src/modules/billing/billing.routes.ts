import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as billingService from './billing.service';

export const billingRouter = Router();

// Get Invoices
billingRouter.get('/invoices', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoices = await billingService.getInvoices();
        return res.json({ invoices });
    } catch (e) {
        return next(e);
    }
});

// Create Invoice
billingRouter.post('/invoices', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingService.createInvoiceSchema.parse(req.body);
        const invoice = await billingService.createInvoice(body);
        return res.status(201).json({ invoice });
    } catch (e) {
        return next(e);
    }
});

// Delete Invoice
billingRouter.delete('/invoices/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const success = await billingService.deleteInvoice(id);
        if (!success) {
            // Note: In a real app we might want to return 404 if not found, 
            // but the original code just returned ok: true
        }
        return res.json({ ok: true });
    } catch (e) {
        return next(e);
    }
});

// Update Invoice Status
billingRouter.patch('/invoices/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const invoice = await billingService.updateInvoiceStatus(id, status);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        return res.json({ invoice });
    } catch (e) {
        return next(e);
    }
});
