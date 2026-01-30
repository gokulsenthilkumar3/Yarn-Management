import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { prisma } from '../../prisma/client';

export const handleSupplierImport = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet) as any[];

        if (data.length === 0) return res.status(400).json({ message: 'File is empty' });

        // Basic mapping based on template
        // Name,Email,Phone,Address,GSTIN,Payment Terms,Rating,Notes,Status
        let count = 0;
        for (const row of data) {
            // Validate required fields
            if (!row['Name']) continue;

            await prisma.supplier.create({
                data: {
                    name: row['Name'],
                    email: row['Email'],
                    phone: row['Phone'],
                    address: row['Address'],
                    gstin: row['GSTIN'],
                    paymentTerms: row['Payment Terms'],
                    rating: row['Rating'] ? parseFloat(row['Rating']) : undefined,
                    notes: row['Notes'],
                    status: row['Status'] || 'Active',
                    businessType: row['Business Type'] || 'Manufacturer',
                    supplierCode: row['Supplier Code'] || `SUP-${Date.now()}-${count}`,
                    supplierType: row['Supplier Type'] || 'Regular'
                }
            });
            count++;
        }

        res.json({ message: `Successfully imported ${count} suppliers` });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Import failed: ' + error.message });
    }
};

export const handleRawMaterialImport = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet) as any[];

        if (data.length === 0) return res.status(400).json({ message: 'File is empty' });

        // Batch No,Supplier Name,Type,Quantity,Unit,Quality Score,Received Date,Cost,Moisture,Location,Status,Notes
        let count = 0;
        for (const row of data) {
            if (!row['Batch No'] || !row['Supplier Name']) continue;

            // Find supplier
            const supplier = await prisma.supplier.findFirst({
                where: { name: row['Supplier Name'] }
            });

            if (!supplier) continue; // Skip if supplier not found (or optionally create)

            await prisma.rawMaterial.create({
                data: {
                    batchNo: row['Batch No'],
                    supplierId: supplier.id,
                    materialType: row['Type'] || 'Unknown',
                    quantity: String(row['Quantity'] || 0),
                    unit: row['Unit'] || 'kg',
                    qualityScore: String(row['Quality Score'] || 0),
                    receivedDate: row['Received Date'] ? new Date(row['Received Date']) : new Date(),
                    costPerUnit: String(row['Cost'] || 0),
                    totalCost: String((row['Quantity'] || 0) * (row['Cost'] || 0)),
                    moistureContent: String(row['Moisture'] || 0),
                    warehouseLocation: row['Location'],
                    status: row['Status'] || 'IN_STOCK',
                    notes: row['Notes']
                }
            });
            count++;
        }

        res.json({ message: `Successfully imported ${count} raw materials` });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Import failed: ' + error.message });
    }
};
