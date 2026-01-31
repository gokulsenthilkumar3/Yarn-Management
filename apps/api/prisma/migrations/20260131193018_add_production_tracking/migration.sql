-- AlterTable
ALTER TABLE "ProductionBatch" ADD COLUMN     "currentStageProgress" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductionAlert" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ProductionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionAlert_batchId_idx" ON "ProductionAlert"("batchId");

-- CreateIndex
CREATE INDEX "ProductionAlert_alertType_idx" ON "ProductionAlert"("alertType");

-- CreateIndex
CREATE INDEX "ProductionAlert_resolvedAt_idx" ON "ProductionAlert"("resolvedAt");

-- AddForeignKey
ALTER TABLE "ProductionAlert" ADD CONSTRAINT "ProductionAlert_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
