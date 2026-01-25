import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const batches = await prisma.productionBatch.count();
    const rms = await prisma.rawMaterial.count();
    const inStock = await prisma.rawMaterial.count({ where: { status: 'IN_STOCK' } });
    const suppliers = await prisma.supplier.count();

    console.log('--- DB STATS ---');
    console.log('Suppliers:', suppliers);
    console.log('Raw Materials:', rms, '(In Stock:', inStock, ')');
    console.log('Batches:', batches);
    console.log('----------------');
}
main().catch(console.error).finally(() => prisma.$disconnect());
