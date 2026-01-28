import { z } from 'zod';

// Mock Invoices Data Store
// In a real app, this would be `prisma.invoice`

export interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    date: string;
    billingCycle: string;
    totalAmount: number;
    status: string;
    items: InvoiceItem[];
}

// Generate Mock Invoices for the last 7 months
const generateMockInvoices = (): Invoice[] => {
    const invoices: Invoice[] = [];
    const customers = ['ABC Textiles', 'XYZ Fabrics', 'Global Corp', 'Fashion Trends', 'Weave Masters'];
    const statuses = ['PAID', 'PENDING', 'OVERDUE'];

    // Last 7 months + current
    const today = new Date();
    for (let i = 0; i < 150; i++) { // 150 invoices
        const monthsAgo = Math.floor(Math.random() * 7);
        const date = new Date(today);
        date.setMonth(today.getMonth() - monthsAgo);
        date.setDate(Math.random() * 28 + 1);

        const customer = customers[Math.floor(Math.random() * customers.length)];
        const amount = 5000 + Math.floor(Math.random() * 95000); // 5k to 100k
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Billing cycle string (e.g., "Jan 2024")
        const billingCycle = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });

        invoices.push({
            id: `INV-${1000 + i}`,
            invoiceNumber: `INV-${date.getFullYear()}-${(1000 + i)}`,
            customerName: customer,
            date: date.toISOString(),
            billingCycle: billingCycle,
            totalAmount: amount,
            status: status,
            items: [
                { description: 'Cotton Yarn Batch', quantity: 10 + Math.floor(Math.random() * 50), price: amount / 10 } // Simplified item logic
            ]
        });
    }
    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

let MOCK_INVOICES = generateMockInvoices();

export const createInvoiceSchema = z.object({
    customerName: z.string().min(1),
    date: z.string().datetime().optional(), // Created Date
    billingCycle: z.string().optional(), // New Field
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        price: z.number().min(0)
    })),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const getInvoices = async () => {
    return MOCK_INVOICES;
};

export const createInvoice = async (body: CreateInvoiceInput) => {
    const total = body.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const newInvoice: Invoice = {
        id: Math.random().toString(36).substring(7),
        invoiceNumber: (() => {
            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const datePart = `${yyyy}${mm}${dd}`; // 8 chars

            // Get strictly 4 chars from customer ID or name
            const custPart = (body.customerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'XXXX').substring(0, 4);

            // Sequence part (4 chars)
            const seq = String(MOCK_INVOICES.length + 1).padStart(4, '0');

            return `${datePart}${custPart}${seq}`; // 8 + 4 + 4 = 16 chars
        })(),
        customerName: body.customerName,
        date: body.date || new Date().toISOString(),
        billingCycle: new Date(body.date || new Date()).toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        totalAmount: total,
        status: 'PENDING',
        items: body.items
    };

    MOCK_INVOICES = [newInvoice, ...MOCK_INVOICES];
    return newInvoice;
};

export const deleteInvoice = async (id: string) => {
    const initialLength = MOCK_INVOICES.length;
    MOCK_INVOICES = MOCK_INVOICES.filter(inv => inv.id !== id);
    return MOCK_INVOICES.length < initialLength;
};

export const updateInvoiceStatus = async (id: string, status: string) => {
    const invoiceIndex = MOCK_INVOICES.findIndex(inv => inv.id === id);
    if (invoiceIndex === -1) return null;

    MOCK_INVOICES[invoiceIndex] = { ...MOCK_INVOICES[invoiceIndex], status };
    return MOCK_INVOICES[invoiceIndex];
};

// Helper for other services to access data
export const getAllInvoicesRaw = () => MOCK_INVOICES;
