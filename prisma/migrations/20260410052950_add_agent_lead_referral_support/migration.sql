/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Subagent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `Subagent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "Subagent" ADD COLUMN     "referralCode" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");

-- CreateIndex
CREATE INDEX "Lead_country_idx" ON "Lead"("country");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Subagent_referralCode_key" ON "Subagent"("referralCode");

-- CreateIndex
CREATE INDEX "Subagent_isActive_idx" ON "Subagent"("isActive");

-- CreateIndex
CREATE INDEX "Subagent_name_idx" ON "Subagent"("name");

-- CreateIndex
CREATE INDEX "Subagent_country_idx" ON "Subagent"("country");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Subagent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
