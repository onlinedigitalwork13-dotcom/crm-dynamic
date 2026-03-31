-- AlterTable
ALTER TABLE "ApplicationJourney" ADD COLUMN     "visaExpiryDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ApplicationJourney_visaExpiryDate_idx" ON "ApplicationJourney"("visaExpiryDate");
