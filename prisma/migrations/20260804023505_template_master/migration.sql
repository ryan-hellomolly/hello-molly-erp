-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('SAMPLE', 'MEASUREMENT', 'CONSTRUCTION');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateTable
CREATE TABLE "TemplateMaster" (
    "id" UUID NOT NULL,
    "type" "TemplateType" NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateMaster_type_status_code_idx" ON "TemplateMaster"("type", "status", "code");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateMaster_type_code_version_key" ON "TemplateMaster"("type", "code", "version");
