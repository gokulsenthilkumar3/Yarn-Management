/*
  Warnings:

  - A unique constraint covering the columns `[supplierCode]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessType` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastModifiedDate` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryContactEmail` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryContactMobile` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryContactName` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredAddressLine1` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredCity` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredCountry` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredPinCode` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredState` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierCode` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierType` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "billingAddressLine1" TEXT,
ADD COLUMN     "billingAddressLine2" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingLandmark" TEXT,
ADD COLUMN     "billingPinCode" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "businessType" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastModifiedBy" TEXT,
ADD COLUMN     "lastModifiedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notesLegacy" TEXT,
ADD COLUMN     "primaryContactDesignation" TEXT,
ADD COLUMN     "primaryContactEmail" TEXT NOT NULL,
ADD COLUMN     "primaryContactLandline" TEXT,
ADD COLUMN     "primaryContactMobile" TEXT NOT NULL,
ADD COLUMN     "primaryContactName" TEXT NOT NULL,
ADD COLUMN     "primaryContactWhatsApp" TEXT,
ADD COLUMN     "registeredAddressLine1" TEXT NOT NULL,
ADD COLUMN     "registeredAddressLine2" TEXT,
ADD COLUMN     "registeredCity" TEXT NOT NULL,
ADD COLUMN     "registeredCountry" TEXT NOT NULL,
ADD COLUMN     "registeredLandmark" TEXT,
ADD COLUMN     "registeredPinCode" TEXT NOT NULL,
ADD COLUMN     "registeredState" TEXT NOT NULL,
ADD COLUMN     "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "secondaryContactName" TEXT,
ADD COLUMN     "secondaryContactNumber" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "supplierCode" TEXT NOT NULL,
ADD COLUMN     "supplierType" TEXT NOT NULL,
ADD COLUMN     "visibilityLevel" TEXT DEFAULT 'Public',
ADD COLUMN     "warehouseAddressLine1" TEXT,
ADD COLUMN     "warehouseAddressLine2" TEXT,
ADD COLUMN     "warehouseCity" TEXT,
ADD COLUMN     "warehouseCountry" TEXT,
ADD COLUMN     "warehouseLandmark" TEXT,
ADD COLUMN     "warehousePinCode" TEXT,
ADD COLUMN     "warehouseState" TEXT;

-- CreateTable
CREATE TABLE "SupplierAccount" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "gstNumber" TEXT,
    "gstType" TEXT,
    "gstVerificationStatus" TEXT DEFAULT 'Pending',
    "panNumber" TEXT,
    "msmeRegNumber" TEXT,
    "udyamRegNumber" TEXT,
    "tradeLicenseNumber" TEXT,
    "iecNumber" TEXT,
    "tinNumber" TEXT,
    "tanNumber" TEXT,
    "tdsRate" DECIMAL(5,2),
    "stateJurisdiction" TEXT,
    "bankAccountHolderName" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountType" TEXT,
    "bankIfscCode" TEXT,
    "bankBranchName" TEXT,
    "bankUpiId" TEXT,
    "bankAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMaterial" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "materialsSupplied" TEXT[],
    "qualityGradesOffered" TEXT[],
    "processingLevel" TEXT,
    "moistureContent" DECIMAL(5,2),
    "impurityLevel" DECIMAL(5,2),
    "colorMix" TEXT,
    "fiberLength" DECIMAL(8,2),
    "stapleLength" DECIMAL(8,2),
    "contaminationLevel" INTEGER,
    "monthlyCapacityTons" DECIMAL(10,2),
    "minimumOrderQuantity" DECIMAL(10,2),
    "maximumOrderQuantity" DECIMAL(10,2),
    "leadTimeDays" INTEGER,
    "deliveryFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPricing" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "basePricePerKg" DECIMAL(10,2),
    "priceBasedOnQuality" BOOLEAN NOT NULL DEFAULT false,
    "quantitySlabs" JSONB,
    "seasonalPriceVariation" BOOLEAN NOT NULL DEFAULT false,
    "creditPeriodDays" INTEGER,
    "advancePaymentPercent" DECIMAL(5,2),
    "paymentMethodsAccepted" TEXT[],
    "earlyPaymentDiscount" DECIMAL(5,2),
    "latePaymentPenalty" DECIMAL(5,2),
    "deliveryMode" TEXT,
    "freightChargesBearer" TEXT,
    "deliveryAreaKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPerformance" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "avgQualityRating" DECIMAL(3,2),
    "rejectionRate" DECIMAL(5,2),
    "qualityConsistencyScore" DECIMAL(5,2),
    "documentationAccuracy" DECIMAL(5,2),
    "onTimeDeliveryPercent" DECIMAL(5,2),
    "avgDelayDays" DECIMAL(5,2),
    "orderFulfillmentRate" DECIMAL(5,2),
    "emergencyOrderCapability" BOOLEAN NOT NULL DEFAULT false,
    "paymentDefaultHistory" BOOLEAN NOT NULL DEFAULT false,
    "creditUtilization" DECIMAL(5,2),
    "invoiceAccuracy" DECIMAL(5,2),
    "disputeResolutionTime" DECIMAL(8,2),
    "supplierScore" INTEGER,
    "riskLevel" TEXT,
    "performanceCategory" TEXT,
    "mandatoryDocuments" JSONB,
    "qualityCertificates" JSONB,
    "legalDocuments" JSONB,
    "lastCommunicationDate" TIMESTAMP(3),
    "communicationMethod" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "communicationNotes" TEXT,
    "totalOrdersPlaced" INTEGER NOT NULL DEFAULT 0,
    "totalQuantitySuppliedKg" DECIMAL(12,2),
    "totalBusinessValue" DECIMAL(12,2),
    "avgOrderValue" DECIMAL(12,2),
    "lastOrderDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "totalComplaints" INTEGER NOT NULL DEFAULT 0,
    "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "pendingComplaints" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTimeHours" DECIMAL(8,2),
    "strategicImportance" TEXT,
    "purchaseVolumeCategory" TEXT,
    "relationshipDuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_supplierId_key" ON "SupplierAccount"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_gstNumber_key" ON "SupplierAccount"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_panNumber_key" ON "SupplierAccount"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_msmeRegNumber_key" ON "SupplierAccount"("msmeRegNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_udyamRegNumber_key" ON "SupplierAccount"("udyamRegNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_tradeLicenseNumber_key" ON "SupplierAccount"("tradeLicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_iecNumber_key" ON "SupplierAccount"("iecNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_tinNumber_key" ON "SupplierAccount"("tinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAccount_tanNumber_key" ON "SupplierAccount"("tanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierMaterial_supplierId_key" ON "SupplierMaterial"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPricing_supplierId_key" ON "SupplierPricing"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPerformance_supplierId_key" ON "SupplierPerformance"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplierCode_key" ON "Supplier"("supplierCode");

-- CreateIndex
CREATE INDEX "Supplier_supplierCode_idx" ON "Supplier"("supplierCode");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- AddForeignKey
ALTER TABLE "SupplierAccount" ADD CONSTRAINT "SupplierAccount_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaterial" ADD CONSTRAINT "SupplierMaterial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPricing" ADD CONSTRAINT "SupplierPricing_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPerformance" ADD CONSTRAINT "SupplierPerformance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
