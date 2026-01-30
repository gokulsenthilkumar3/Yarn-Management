-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "approverId" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "periodKey" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_category_periodKey_key" ON "Budget"("category", "periodKey");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
