-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('SIZE', 'UNIT', 'CURRENCY', 'TRADE_TERM');

-- CreateTable
CREATE TABLE "ReferenceValue" (
    "id" UUID NOT NULL,
    "type" "ReferenceType" NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "category" TEXT,
    "symbol" TEXT,
    "descriptionEn" TEXT,
    "descriptionZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceValue_type_active_sortOrder_idx" ON "ReferenceValue"("type", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceValue_type_code_key" ON "ReferenceValue"("type", "code");
