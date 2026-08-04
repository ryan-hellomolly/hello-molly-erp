-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferenceType" ADD VALUE 'SETTLEMENT_METHOD';
ALTER TYPE "ReferenceType" ADD VALUE 'INVOICE_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'SAMPLE_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'EXPENSE_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'SALES_CHANNEL';
