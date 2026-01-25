import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function upsertPermission(code: string, name: string) {
  return prisma.permission.upsert({
    where: { code },
    update: { name },
    create: { code, name },
    select: { id: true, code: true },
  });
}

async function upsertRole(code: string, name: string) {
  return prisma.role.upsert({
    where: { code },
    update: { name },
    create: { code, name },
    select: { id: true, code: true },
  });
}

async function main() {
  // 1. Roles & Permissions
  const permissions = [
    await upsertPermission('users.read', 'Read users'),
    await upsertPermission('users.create', 'Create users'),
    await upsertPermission('suppliers.read', 'Read suppliers'),
    await upsertPermission('suppliers.create', 'Create suppliers'),
    await upsertPermission('suppliers.update', 'Update suppliers'),
    await upsertPermission('suppliers.delete', 'Delete suppliers'),
  ];

  const adminRole = await upsertRole('ADMIN', 'Administrator');

  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: env.ADMIN_EMAIL,
      passwordHash,
      status: 'ACTIVE',
      roles: {
        create: [{ roleId: adminRole.id }],
      },
    },
    select: { id: true, email: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('--- Seeding Master Data ---');

  // 2. Suppliers
  const suppliersData = [
    { name: 'Global Cotton Co', code: 'SUP-001', type: 'Raw Material', city: 'Mumbai' },
    { name: 'Silk Road Traders', code: 'SUP-002', type: 'Raw Material', city: 'Bangalore' },
    { name: 'PolySynth Ltd', code: 'SUP-003', type: 'Raw Material', city: 'Surat' },
    { name: 'Coimbatore Yarns', code: 'SUP-004', type: 'Raw Material', city: 'Coimbatore' },
    { name: 'Tirupur Dyes', code: 'SUP-005', type: 'Chemicals', city: 'Tirupur' },
  ];

  const suppliers = [];
  for (const s of suppliersData) {
    console.log(`Seeding Supplier: ${s.name}`); // ADDED LOG
    const supplier = await prisma.supplier.upsert({
      where: { supplierCode: s.code },
      update: {},
      create: {
        name: s.name,
        supplierCode: s.code,
        supplierType: s.type,
        businessType: 'Manufacturer',
        billingCity: s.city,
        email: `contact@${s.code.toLowerCase()}.com`.replace('-', ''),
        phone: '9876543210'
      }
    });
    suppliers.push(supplier);
  }

  // 3. Raw Materials (Spread across last 7 months)
  const materialTypes = ['Cotton Bale', 'Silk Yarn', 'Polyester Fiber', 'Viscose', 'Linen'];
  const grades = ['Premium', 'Standard', 'Grade A', 'Grade B'];
  const locations = ['Warehouse A', 'Warehouse B', 'Zone 1', 'Zone 2'];

  const rawMaterials = [];

  // Helper to get date X months ago
  const getDate = (monthsAgo: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return d;
  };

  for (let i = 0; i < 20; i++) {
    const monthsAgo = i % 7;
    const supplier = suppliers[i % suppliers.length];

    // Check if exists to avoid unique constraint error on re-seed
    const batchNo = `RM-${202400 + i}`;
    const existing = await prisma.rawMaterial.findUnique({ where: { batchNo } });

    if (!existing) {
      const qty = 500 + Math.random() * 4500;
      const price = 100 + Math.random() * 400;

      const rm = await prisma.rawMaterial.create({
        data: {
          batchNo,
          supplierId: supplier.id,
          materialType: materialTypes[i % materialTypes.length],
          quantity: qty,
          costPerUnit: price,
          totalCost: qty * price,
          qualityScore: 8 + Math.random() * 2,
          receivedDate: getDate(monthsAgo),
          warehouseLocation: locations[i % locations.length],
          status: 'IN_STOCK',
        }
      });
      rawMaterials.push(rm);
    }
  }

  // 4. Production Batches, Wastage & Finished Goods
  // We need to fetch all RM again to be sure
  const allRMs = await prisma.rawMaterial.findMany();

  for (let i = 0; i < 50; i++) {
    const rm = allRMs[i % allRMs.length];
    const statusIdx = i % 3; // 0: PENDING, 1: IN_PROGRESS, 2: COMPLETED
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    const currentStatus = statuses[statusIdx];

    const batchNum = `B-${1000 + i}`;
    const existingBatch = await prisma.productionBatch.findUnique({ where: { batchNumber: batchNum } });

    if (!existingBatch) {
      const batch = await prisma.productionBatch.create({
        data: {
          batchNumber: batchNum,
          rawMaterialId: rm.id,
          inputQuantity: 100 + Math.random() * 400,
          status: currentStatus as any,
          currentStage: currentStatus === 'COMPLETED' ? 'COMPLETED' : 'SPINNING',
          startDate: getDate(1),
          endDate: currentStatus === 'COMPLETED' ? new Date() : null,
        }
      });

      // Add Logic for Completed Batches
      if (currentStatus === 'COMPLETED') {
        // Create Wastage
        await prisma.wastageLog.create({
          data: {
            batchId: batch.id,
            stage: 'SPINNING',
            quantity: 5 + Math.random() * 20,
            wasteType: 'Hard Waste',
            reason: 'Machine Calibration'
          }
        });

        // Create Finished Good
        await prisma.finishedGood.create({
          data: {
            batchId: batch.id,
            yarnCount: ['30s', '40s', '60s', '80s'][i % 4],
            producedQuantity: Number(batch.inputQuantity) * 0.9, // 90% yield
            qualityGrade: i % 5 === 0 ? 'B' : 'A',
            packingDate: new Date(),
            warehouseLocation: 'FG Store'
          }
        });
      }
    }
  }

  console.log('--- Seeding Completed ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
