-- DropForeignKey
ALTER TABLE "RawMaterial" DROP CONSTRAINT "RawMaterial_supplierId_fkey";

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "primaryContactEmail" DROP NOT NULL,
ALTER COLUMN "primaryContactMobile" DROP NOT NULL,
ALTER COLUMN "primaryContactName" DROP NOT NULL,
ALTER COLUMN "registeredAddressLine1" DROP NOT NULL,
ALTER COLUMN "registeredCity" DROP NOT NULL,
ALTER COLUMN "registeredCountry" DROP NOT NULL,
ALTER COLUMN "registeredPinCode" DROP NOT NULL,
ALTER COLUMN "registeredState" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RawMaterial" ADD CONSTRAINT "RawMaterial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
