-- CreateEnum
CREATE TYPE "InspectionEntity" AS ENUM ('RAW_MATERIAL', 'PRODUCTION_BATCH');

-- CreateEnum
CREATE TYPE "TestEntity" AS ENUM ('RAW_MATERIAL', 'PRODUCTION_BATCH');

-- CreateEnum
CREATE TYPE "DefectEntity" AS ENUM ('RAW_MATERIAL', 'PRODUCTION_BATCH', 'FINISHED_GOOD');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL_PASS');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "inspectionNumber" TEXT NOT NULL,
    "entityType" "InspectionEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "templateId" TEXT,
    "inspectorId" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "result" "InspectionResult",
    "checklistItems" JSONB NOT NULL,
    "notes" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityTest" (
    "id" TEXT NOT NULL,
    "testNumber" TEXT NOT NULL,
    "entityType" "TestEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testParameters" JSONB NOT NULL,
    "qualityScore" DECIMAL(5,2),
    "qualityGrade" TEXT,
    "status" "TestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "certificateUrl" TEXT,
    "testedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectLog" (
    "id" TEXT NOT NULL,
    "defectNumber" TEXT NOT NULL,
    "entityType" "DefectEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "defectCategory" TEXT NOT NULL,
    "defectType" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "quantity" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "actionStatus" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "actionDueDate" TIMESTAMP(3),
    "actionCompletedDate" TIMESTAMP(3),
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportedBy" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefectLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "InspectionEntity" NOT NULL,
    "checklistItems" JSONB NOT NULL,
    "testParameters" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_inspectionNumber_key" ON "QualityInspection"("inspectionNumber");

-- CreateIndex
CREATE INDEX "QualityInspection_entityType_entityId_idx" ON "QualityInspection"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QualityInspection_status_idx" ON "QualityInspection"("status");

-- CreateIndex
CREATE INDEX "QualityInspection_inspectionDate_idx" ON "QualityInspection"("inspectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "QualityTest_testNumber_key" ON "QualityTest"("testNumber");

-- CreateIndex
CREATE INDEX "QualityTest_entityType_entityId_idx" ON "QualityTest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QualityTest_status_idx" ON "QualityTest"("status");

-- CreateIndex
CREATE INDEX "QualityTest_testDate_idx" ON "QualityTest"("testDate");

-- CreateIndex
CREATE UNIQUE INDEX "DefectLog_defectNumber_key" ON "DefectLog"("defectNumber");

-- CreateIndex
CREATE INDEX "DefectLog_entityType_entityId_idx" ON "DefectLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DefectLog_defectCategory_idx" ON "DefectLog"("defectCategory");

-- CreateIndex
CREATE INDEX "DefectLog_severity_idx" ON "DefectLog"("severity");

-- CreateIndex
CREATE INDEX "DefectLog_actionStatus_idx" ON "DefectLog"("actionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTemplate_name_key" ON "InspectionTemplate"("name");

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
