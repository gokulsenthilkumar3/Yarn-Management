import { z } from 'zod';

export const createCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstin: z.string().optional(),
});

export const createInvoiceSchema = z.object({
    customerId: z.string().uuid(),
    dueDate: z.string().datetime(),
    items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        finishedGoodId: z.string().uuid().optional(),
    })).min(1, 'At least one item required'),
    taxRate: z.number().default(0.18), // Default 18% GST
    notes: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
});
