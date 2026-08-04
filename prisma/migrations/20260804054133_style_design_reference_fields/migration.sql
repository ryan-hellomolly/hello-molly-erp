/*
  Warnings:

  - You are about to drop the column `category` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `season` on the `Style` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferenceType" ADD VALUE 'STYLE_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'SEASON';
ALTER TYPE "ReferenceType" ADD VALUE 'YEAR';
ALTER TYPE "ReferenceType" ADD VALUE 'STAGE';
ALTER TYPE "ReferenceType" ADD VALUE 'PROCESSING_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'WASH_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'FABRIC_TRIM_TYPE';
ALTER TYPE "ReferenceType" ADD VALUE 'EXECUTION_STANDARD';

-- AlterTable
ALTER TABLE "Style" DROP COLUMN "category",
DROP COLUMN "season",
ADD COLUMN     "brandPrice" DOUBLE PRECISION,
ADD COLUMN     "canSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "composition" TEXT,
ADD COLUMN     "designNumber" TEXT,
ADD COLUMN     "patternMakerName" TEXT,
ADD COLUMN     "seasonId" UUID,
ADD COLUMN     "stageId" UUID,
ADD COLUMN     "styleTypeId" UUID,
ADD COLUMN     "yearId" UUID;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_styleTypeId_fkey" FOREIGN KEY ("styleTypeId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
