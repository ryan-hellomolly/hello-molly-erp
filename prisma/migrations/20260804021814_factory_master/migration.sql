-- CreateEnum
CREATE TYPE "FactoryStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'INACTIVE');

-- CreateTable
CREATE TABLE "Factory" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "city" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "FactoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factory_code_key" ON "Factory"("code");

-- CreateIndex
CREATE INDEX "Factory_name_idx" ON "Factory"("name");

-- CreateIndex
CREATE INDEX "Factory_status_idx" ON "Factory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_normalizedName_countryCode_key" ON "Factory"("normalizedName", "countryCode");
