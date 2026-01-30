import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
}

export const createInvoiceSchema = z.object({
    customerName: z.string().min(1),
    date: z.string().datetime().optional(),
    billingCycle: z.string().optional(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        price: z.number().min(0)
    })),
    isRecurring: z.boolean().optional(),
    frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
    notes: z.string().optional(),
    templateName: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const getInvoices = async () => {
    return await prisma.invoice.findMany({
        include: { items: true, recurringConfig: true },
        orderBy: { date: 'desc' },
    });
};

export const createInvoice = async (body: CreateInvoiceInput) => {
    const totalAmount = body.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = totalAmount * 0.18;

    return await prisma.$transaction(async (tx) => {
        const invoiceCount = await tx.invoice.count();
        const invoice = await tx.invoice.create({
            data: {
                invoiceNumber: generateInvoiceNumber(body.customerName, invoiceCount + 1),
                customerName: body.customerName,
                date: body.date ? new Date(body.date) : new Date(),
                billingCycle: body.billingCycle || new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' }),
                totalAmount: new Prisma.Decimal(totalAmount + taxAmount),
                taxAmount: new Prisma.Decimal(taxAmount),
                status: 'PENDING',
                notes: body.notes,
                templateName: body.templateName || 'STANDARD',
                isRecurring: body.isRecurring || false,
                items: {
                    create: body.items.map(item => ({
                        description: item.description,
                        quantity: new Prisma.Decimal(item.quantity),
                        unitPrice: new Prisma.Decimal(item.price),
                        totalPrice: new Prisma.Decimal(item.quantity * item.price),
                    }))
                }
            },
            include: { items: true }
        });
        // ... rest of createInvoice

        if (body.isRecurring && body.frequency) {
            const nextRunDate = new Date();
            if (body.frequency === 'MONTHLY') nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            else if (body.frequency === 'QUARTERLY') nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            else if (body.frequency === 'ANNUALLY') nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);

            await tx.recurringBillingConfig.create({
                data: {
                    invoiceId: invoice.id,
                    frequency: body.frequency,
                    nextRunDate,
                }
            });
        }

        return invoice;
    });
};

export const deleteInvoice = async (id: string) => {
    try {
        await prisma.invoice.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
};

export const updateInvoiceStatus = async (id: string, status: any) => {
    try {
        return await prisma.invoice.update({
            where: { id },
            data: { status },
            include: { items: true }
        });
    } catch {
        return null;
    }
};

export const processRecurringInvoices = async () => {
    const today = new Date();
    const dueConfigs = await prisma.recurringBillingConfig.findMany({
        where: {
            isActive: true,
            nextRunDate: { lte: today },
        },
        include: { invoice: { include: { items: true } } }
    });

    for (const config of dueConfigs) {
        // Generate new invoice based on the template (current config.invoice)
        await prisma.$transaction(async (tx) => {
            const invoiceCount = await tx.invoice.count();
            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber: generateInvoiceNumber(config.invoice.customerName, invoiceCount + 1),
                    customerName: config.invoice.customerName,
                    date: new Date(),
                    billingCycle: new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' }),
                    totalAmount: config.invoice.totalAmount,
                    taxAmount: config.invoice.taxAmount,
                    status: 'PENDING',
                    notes: `Auto-generated from ${config.invoice.invoiceNumber}. ${config.invoice.notes || ''}`,
                    isRecurring: false,
                    templateName: config.invoice.templateName,
                    items: {
                        create: config.invoice.items.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                        }))
                    }
                }
            });

            // Update next run date
            const nextRunDate = new Date(config.nextRunDate);
            if (config.frequency === 'MONTHLY') nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            else if (config.frequency === 'QUARTERLY') nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            else if (config.frequency === 'ANNUALLY') nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);

            await tx.recurringBillingConfig.update({
                where: { id: config.id },
                data: { nextRunDate }
            });
        });
    }

    return dueConfigs.length;
};

export const checkOverdueInvoices = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingInvoices = await prisma.invoice.findMany({
        where: {
            status: 'PENDING',
            date: { lte: thirtyDaysAgo },
        }
    });

    for (const invoice of pendingInvoices) {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'OVERDUE' }
        });

        // Trigger notifications (could be imported dynamically to avoid circular deps if needed)
        // For now we'll just log or assume a separate process handles the aggregate notification
    }

    return pendingInvoices.length;
};

const generateInvoiceNumber = (customerName: string, sequence: number) => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const datePart = `${yyyy}${mm}${dd}`;

    const custPart = (customerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'XXXX').substring(0, 4);
    const seqPart = String(sequence).padStart(4, '0');

    return `${datePart}${custPart}${seqPart}`;
};

export const createCreditNoteSchema = z.object({
    invoiceId: z.string().optional(),
    customerName: z.string().min(1),
    amount: z.number().positive(),
    reason: z.enum(['RETURNED_GOODS', 'OVERCHARGED', 'DAMAGED_ITEMS', 'OTHER']),
    notes: z.string().optional(),
});

export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;

export const createCreditNote = async (body: CreateCreditNoteInput) => {
    return await prisma.$transaction(async (tx) => {
        const count = await tx.creditNote.count();
        const creditNote = await tx.creditNote.create({
            data: {
                creditNoteNumber: `CN-${generateInvoiceNumber(body.customerName, count + 1)}`,
                customerName: body.customerName,
                invoiceId: body.invoiceId,
                amount: new Prisma.Decimal(body.amount),
                reason: body.reason,
                notes: body.notes,
            }
        });

        // Optionally update invoice status if linked
        if (body.invoiceId && body.reason === 'OVERCHARGED') {
            // Logic to adjust invoice could go here
        }

        return creditNote;
    });
};

export const getCreditNotes = async () => {
    return await prisma.creditNote.findMany({
        include: { invoice: true },
        orderBy: { date: 'desc' },
    });
};

export const createDebitNoteSchema = z.object({
    invoiceId: z.string().optional(),
    customerName: z.string().min(1),
    amount: z.number().positive(),
    reason: z.string().min(1),
    notes: z.string().optional(),
});

export type CreateDebitNoteInput = z.infer<typeof createDebitNoteSchema>;

export const createDebitNote = async (body: CreateDebitNoteInput) => {
    return await prisma.$transaction(async (tx) => {
        const count = await tx.debitNote.count();
        const debitNote = await tx.debitNote.create({
            data: {
                debitNoteNumber: `DN-${generateInvoiceNumber(body.customerName, count + 1)}`,
                customerName: body.customerName,
                invoiceId: body.invoiceId,
                amount: new Prisma.Decimal(body.amount),
                reason: body.reason,
                notes: body.notes,
            }
        });
        return debitNote;
    });
};

export const getDebitNotes = async () => {
    return await prisma.debitNote.findMany({
        include: { invoice: true },
        orderBy: { date: 'desc' },
    });
};
