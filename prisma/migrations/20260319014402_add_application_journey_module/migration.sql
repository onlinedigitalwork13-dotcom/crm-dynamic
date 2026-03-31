-- CreateTable
CREATE TABLE "ApplicationJourney" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "offerStatus" TEXT NOT NULL DEFAULT 'not_started',
    "offerType" TEXT,
    "offerConditions" TEXT,
    "offerReceivedAt" TIMESTAMP(3),
    "offerAcceptedAt" TIMESTAMP(3),
    "coeStatus" TEXT NOT NULL DEFAULT 'not_started',
    "coeNumber" TEXT,
    "coeIssuedAt" TIMESTAMP(3),
    "visaStatus" TEXT NOT NULL DEFAULT 'not_started',
    "visaFileNumber" TEXT,
    "visaLodgedAt" TIMESTAMP(3),
    "visaGrantedAt" TIMESTAMP(3),
    "visaRefusedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationJourney_applicationId_key" ON "ApplicationJourney"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationJourney_offerStatus_idx" ON "ApplicationJourney"("offerStatus");

-- CreateIndex
CREATE INDEX "ApplicationJourney_coeStatus_idx" ON "ApplicationJourney"("coeStatus");

-- CreateIndex
CREATE INDEX "ApplicationJourney_visaStatus_idx" ON "ApplicationJourney"("visaStatus");

-- AddForeignKey
ALTER TABLE "ApplicationJourney" ADD CONSTRAINT "ApplicationJourney_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ClientApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
