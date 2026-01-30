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

// Credit Notes
billingRouter.get('/credit-notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const creditNotes = await billingService.getCreditNotes();
        return res.json({ creditNotes });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/credit-notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingService.createCreditNoteSchema.parse(req.body);
        const creditNote = await billingService.createCreditNote(body);
        return res.status(201).json({ creditNote });
    } catch (e) {
        return next(e);
    }
});

// Debit Notes
billingRouter.get('/debit-notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const debitNotes = await billingService.getDebitNotes();
        return res.json({ debitNotes });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/debit-notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingService.createDebitNoteSchema.parse(req.body);
        const debitNote = await billingService.createDebitNote(body);
        return res.status(201).json({ debitNote });
    } catch (e) {
        return next(e);
    }
});
