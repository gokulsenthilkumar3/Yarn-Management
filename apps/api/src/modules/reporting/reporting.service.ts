import { prisma } from '../../prisma/client';

// Executive Dashboard KPIs
export async function getDashboardKPIs() {
    // 1. Financial KPIs
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
        where: {
            date: { gte: currentMonth },
        },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalProfit = totalRevenue * 0.25; // Estimated 25% profit margin for now

    // 2. Operational KPIs
    const activeProductionBatches = await prisma.productionBatch.count({
        where: { status: 'IN_PROGRESS' },
    });

    const activeOperators = await prisma.productionStage.groupBy({
        by: ['operatorName'],
        where: { status: 'IN_PROGRESS' },
        _count: true,
    });
    const operatorCount = activeOperators.length;

    // 3. Efficiency (OEE - Simplified)
    // Formula: (Good Units / Total Units) * Availability * Performance (Simplified to just Good/Total for MVP)
    const completedBatches = await prisma.productionBatch.findMany({
        where: {
            status: 'COMPLETED',
            endDate: { gte: currentMonth },
        },
        include: {
            stages: true,
        },
    });

    let totalQualityScore = 0;
    let batchCount = 0;

    for (const batch of completedBatches) {
        // Assuming we have quality checks linked or we use a proxy
        batchCount++;
        // Use batch.qualityScore if available, defaulting to 85
        totalQualityScore += Number(batch.qualityScore) || 85;
    }

    const oee = batchCount > 0 ? totalQualityScore / batchCount : 0;


    return {
        financial: {
            revenue: totalRevenue,
            profit: totalProfit,
            growth: 12.5, // Placeholder growth percentage
        },
        operations: {
            activeBatches: activeProductionBatches,
            activeOperators: operatorCount,
            efficiency: Math.round(oee),
        },
        charts: {
            revenueVsCost: await getRevenueVsCostChart(),
            operationalEfficiency: await getEfficiencyChart(),
        }
    };
}

async function getRevenueVsCostChart() {
    // Last 6 months
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toLocaleString('default', { month: 'short' });

        // Mock data for now, ideally aggregated from DB
        const revenue = 50000 + Math.random() * 20000;
        const cost = 30000 + Math.random() * 15000;

        data.push({ name: month, revenue: Math.round(revenue), cost: Math.round(cost) });
    }
    return data;
}

async function getEfficiencyChart() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.getDate().toString();

        data.push({ day, efficiency: 70 + Math.random() * 25 });
    }
    return data;
}


// Custom Report Builder Logic
export async function generateCustomReport(source: string, fields: string[], filters: any) {
    let data: any[] = [];

    // Map source to Prisma Delegate
    switch (source) {
        case 'orders':
            // Assuming orders map to Invoices or SalesOrders
            data = await prisma.invoice.findMany({
                select: buildSelectObject(fields),
                where: buildWhereClause(filters),
                take: 100,
            });
            break;
        case 'inventory':
            data = await prisma.rawMaterial.findMany({
                select: buildSelectObject(fields),
                where: buildWhereClause(filters),
                take: 100,
            });
            break;
        case 'production':
            data = await prisma.productionBatch.findMany({
                select: buildSelectObject(fields),
                where: buildWhereClause(filters),
                take: 100,
            });
            break;
        case 'suppliers':
            data = await prisma.supplier.findMany({
                select: buildSelectObject(fields),
                where: buildWhereClause(filters),
                take: 100,
            })
            break;
        default:
            throw new Error(`Unknown data source: ${source}`);
    }

    return data;
}

function buildSelectObject(fields: string[]) {
    // If empty, return undefined to select all (or handle default)
    if (!fields || fields.length === 0) return undefined;

    const select: any = {};
    fields.forEach(f => select[f] = true);

    // Always include ID if possible
    select['id'] = true;
    return select;
}

function buildWhereClause(filters: any) {
    if (!filters) return {};

    const where: any = {};
    if (filters.dateRange && filters.dateField) {
        where[filters.dateField] = {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end),
        };
    }

    // Add more dynamic filters here
    return where;
}

// Compliance Reports
export async function getComplianceReport(type: string, params: any) {
    if (type === 'gstr1') {
        const invoices = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: new Date(params.startDate),
                    lte: new Date(params.endDate),
                }
            },
            include: {
                customer: true, // Assuming relation exists, or we fetch details
                items: true,
            }
        });

        // Transform for GSTR-1 format
        return invoices.map(inv => ({
            gstin: 'URP', // Unregistered Person or fetch from customer
            invoiceNumber: inv.invoiceNumber,
            date: inv.date,
            value: inv.totalAmount,
            taxRate: 18, // Simplified
            taxableValue: Number(inv.totalAmount) / 1.18,
        }));
    }

    if (type === 'financials') {
        // P&L Summary
        const revenue = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
                date: {
                    gte: new Date(params.startDate),
                    lte: new Date(params.endDate),
                }
            }
        });

        // Simple mock P&L
        const totalRevenue = Number(revenue._sum.totalAmount || 0);
        const cogs = totalRevenue * 0.6; // 60% approx
        const opex = totalRevenue * 0.2; // 20% approx

        return {
            revenue: totalRevenue,
            cogs,
            grossProfit: totalRevenue - cogs,
            expenses: opex,
            netProfit: totalRevenue - cogs - opex
        };
    }

    return [];
}

// --- Phase 3 Advanced Features: Scheduled Reporting ---

export async function createReportSchedule(data: {
    name: string;
    reportType: string;
    frequency: string;
    recipients: string[];
    filters?: any;
    nextRun: Date;
}) {
    return await prisma.reportSchedule.create({
        data: {
            ...data,
            isActive: true
        }
    });
}

export async function getReportSchedules() {
    return await prisma.reportSchedule.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteReportSchedule(id: string) {
    return await prisma.reportSchedule.delete({
        where: { id }
    });
}

/**
 * Background Engine: Process due reports
 */
export async function processScheduledReports() {
    const now = new Date();
    const dueReports = await prisma.reportSchedule.findMany({
        where: {
            isActive: true,
            nextRun: { lte: now }
        }
    });

    console.log(`[ReportingEngine] Processing ${dueReports.length} due reports...`);

    for (const schedule of dueReports) {
        try {
            // 1. Generate report data
            const data = await generateCustomReport(schedule.reportType, [], schedule.filters);

            // 2. Simulate PDF/CSV generation & Email delivery
            await simulateEmailDelivery(schedule, data);

            // 3. Update next run time
            const nextRun = calculateNextRun(schedule.frequency, now);
            await prisma.reportSchedule.update({
                where: { id: schedule.id },
                data: {
                    lastRun: now,
                    nextRun: nextRun
                }
            });
        } catch (error) {
            console.error(`[ReportingEngine] Failed to process report ${schedule.id}:`, error);
        }
    }
}

async function simulateEmailDelivery(schedule: any, data: any) {
    console.log(`[ReportingEngine] Sending report "${schedule.name}" to: ${schedule.recipients.join(', ')}`);
    // In production, use nodemailer or a service like SendGrid
    return Promise.resolve();
}

function calculateNextRun(frequency: string, lastRun: Date): Date {
    const next = new Date(lastRun);
    if (frequency === 'DAILY') {
        next.setDate(next.getDate() + 1);
    } else if (frequency === 'WEEKLY') {
        next.setDate(next.getDate() + 7);
    } else {
        next.setMonth(next.getMonth() + 1);
    }
    return next;
}

// --- Export Utility ---
export function exportToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','));
    return [headers.join(','), ...rows].join('\n');
}
