import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as billingService from './billing.service';
import * as billingSchemas from './billing.schemas';

export const billingRouter = Router();

// Customers
billingRouter.get('/customers', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const customers = await billingService.getCustomers();
        return res.json({ customers });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/customers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingSchemas.createCustomerSchema.parse(req.body);
        const customer = await billingService.createCustomer(body);
        return res.status(201).json({ customer });
    } catch (e) {
        return next(e);
    }
});

billingRouter.patch('/customers/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const body = billingSchemas.updateCustomerSchema.parse(req.body);
        const customer = await billingService.updateCustomer(id, body);
        return res.json({ customer });
    } catch (e) {
        return next(e);
    }
});

billingRouter.delete('/customers/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const ok = await billingService.deleteCustomer(id);
        return res.json({ ok });
    } catch (e) {
        return next(e);
    }
});

// Accounts Receivable
billingRouter.get('/ar/customers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asOf = typeof req.query.asOf === 'string' ? new Date(req.query.asOf) : undefined;
        const customers = await billingService.getArCustomersSummary(asOf);
        return res.json({ customers });
    } catch (e) {
        return next(e);
    }
});

billingRouter.get('/ar/customers/:id/ledger', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const ledger = await billingService.getCustomerLedger(id);
        if (!ledger) return res.status(404).json({ message: 'Customer not found' });
        return res.json({ ledger });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/ar/payments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingSchemas.createArPaymentSchema.parse(req.body);
        const payment = await billingService.createArPayment(req.userId, body);
        return res.status(201).json({ payment });
    } catch (e) {
        return next(e);
    }
});

billingRouter.get('/ar/follow-ups', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const followUps = await billingService.getArFollowUps({ status });
        return res.json({ followUps });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/ar/follow-ups', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingSchemas.createArFollowUpSchema.parse(req.body);
        const followUp = await billingService.createArFollowUp(req.userId, body);
        return res.status(201).json({ followUp });
    } catch (e) {
        return next(e);
    }
});

billingRouter.patch('/ar/follow-ups/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const body = billingSchemas.updateArFollowUpSchema.parse(req.body);
        const followUp = await billingService.updateArFollowUp(id, body);
        return res.json({ followUp });
    } catch (e) {
        return next(e);
    }
});

billingRouter.post('/ar/bad-debt', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = billingSchemas.createBadDebtProvisionSchema.parse(req.body);
        const provision = await billingService.createBadDebtProvision(req.userId, body);
        return res.status(201).json({ provision });
    } catch (e) {
        return next(e);
    }
});

billingRouter.get('/ar/metrics', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await billingService.getCollectionMetrics();
        return res.json({ metrics });
    } catch (e) {
        return next(e);
    }
});

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
