-- CreateEnum
CREATE TYPE "StyleStatus" AS ENUM ('DRAFT', 'IN_DEVELOPMENT', 'SAMPLE_APPROVED', 'ACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "StyleColorwayStatus" AS ENUM ('ACTIVE', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "Style" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "category" TEXT,
    "season" TEXT,
    "customerId" UUID,
    "unitId" UUID,
    "constructionTemplateId" UUID,
    "measurementTemplateId" UUID,
    "notes" TEXT,
    "status" "StyleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleColorway" (
    "id" UUID NOT NULL,
    "styleId" UUID NOT NULL,
    "colorCode" TEXT NOT NULL,
    "colorNameEn" TEXT NOT NULL,
    "colorNameZh" TEXT NOT NULL,
    "status" "StyleColorwayStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleColorway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Style_code_key" ON "Style"("code");

-- CreateIndex
CREATE INDEX "Style_nameEn_idx" ON "Style"("nameEn");

-- CreateIndex
CREATE INDEX "Style_status_idx" ON "Style"("status");

-- CreateIndex
CREATE INDEX "Style_customerId_idx" ON "Style"("customerId");

-- CreateIndex
CREATE INDEX "StyleColorway_styleId_status_idx" ON "StyleColorway"("styleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StyleColorway_styleId_colorCode_key" ON "StyleColorway"("styleId", "colorCode");

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_constructionTemplateId_fkey" FOREIGN KEY ("constructionTemplateId") REFERENCES "TemplateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_measurementTemplateId_fkey" FOREIGN KEY ("measurementTemplateId") REFERENCES "TemplateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleColorway" ADD CONSTRAINT "StyleColorway_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
