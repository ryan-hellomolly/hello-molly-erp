-- AlterTable
ALTER TABLE "ReferenceValue" ADD COLUMN     "parentId" UUID;

-- CreateIndex
CREATE INDEX "ReferenceValue_parentId_idx" ON "ReferenceValue"("parentId");

-- AddForeignKey
ALTER TABLE "ReferenceValue" ADD CONSTRAINT "ReferenceValue_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ReferenceValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
