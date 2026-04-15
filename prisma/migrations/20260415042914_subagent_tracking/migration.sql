-- AlterTable
ALTER TABLE "IntakeFormSubmission" ADD COLUMN     "subagentId" TEXT;

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_subagentId_idx" ON "IntakeFormSubmission"("subagentId");

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_subagentId_fkey" FOREIGN KEY ("subagentId") REFERENCES "Subagent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
