-- CreateEnum
CREATE TYPE "PerformanceMetricType" AS ENUM ('ON_TIME_DELIVERY', 'QUALITY_SCORE', 'PRICE_COMPETITIVENESS', 'RESPONSIVENESS', 'ORDER_ACCURACY', 'DEFECT_RATE', 'LEAD_TIME_ADHERENCE', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'QUALITY', 'DELIVERY', 'GEOPOLITICAL');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "lastPerformanceUpdate" TIMESTAMP(3),
ADD COLUMN     "performanceScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "riskScore" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "SupplierPerformanceMetric" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "metricType" "PerformanceMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "SupplierPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRating" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRiskAssessment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "riskCategory" "RiskCategory" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "mitigationPlan" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,

    CONSTRAINT "SupplierRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierPerformanceMetric_supplierId_idx" ON "SupplierPerformanceMetric"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPerformanceMetric_metricType_idx" ON "SupplierPerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "SupplierPerformanceMetric_recordedAt_idx" ON "SupplierPerformanceMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "SupplierRating_supplierId_idx" ON "SupplierRating"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierRating_userId_idx" ON "SupplierRating"("userId");

-- CreateIndex
CREATE INDEX "SupplierRating_createdAt_idx" ON "SupplierRating"("createdAt");

-- CreateIndex
CREATE INDEX "SupplierRiskAssessment_supplierId_idx" ON "SupplierRiskAssessment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierRiskAssessment_riskLevel_idx" ON "SupplierRiskAssessment"("riskLevel");

-- CreateIndex
CREATE INDEX "SupplierRiskAssessment_riskCategory_idx" ON "SupplierRiskAssessment"("riskCategory");

-- CreateIndex
CREATE INDEX "SupplierRiskAssessment_status_idx" ON "SupplierRiskAssessment"("status");

-- AddForeignKey
ALTER TABLE "SupplierPerformanceMetric" ADD CONSTRAINT "SupplierPerformanceMetric_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRating" ADD CONSTRAINT "SupplierRating_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRating" ADD CONSTRAINT "SupplierRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRiskAssessment" ADD CONSTRAINT "SupplierRiskAssessment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRiskAssessment" ADD CONSTRAINT "SupplierRiskAssessment_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
