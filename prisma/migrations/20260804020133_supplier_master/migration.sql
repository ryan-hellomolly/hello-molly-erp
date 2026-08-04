-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "category" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCertification" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "certificationType" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "issuedBy" TEXT,
    "validFrom" DATE,
    "expiresAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_normalizedName_countryCode_key" ON "Supplier"("normalizedName", "countryCode");

-- CreateIndex
CREATE INDEX "SupplierCertification_supplierId_expiresAt_idx" ON "SupplierCertification"("supplierId", "expiresAt");

-- CreateIndex
CREATE INDEX "SupplierCertification_expiresAt_idx" ON "SupplierCertification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCertification_supplierId_certificationType_certific_key" ON "SupplierCertification"("supplierId", "certificationType", "certificateNumber");

-- AddForeignKey
ALTER TABLE "SupplierCertification" ADD CONSTRAINT "SupplierCertification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
