-- CreateTable
CREATE TABLE "ClientCheckIn" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "intakeSubmissionId" TEXT,
    "branchId" TEXT NOT NULL,
    "checkInMethod" TEXT NOT NULL DEFAULT 'qr',
    "visitReason" TEXT,
    "notes" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientCheckIn_clientId_checkedInAt_idx" ON "ClientCheckIn"("clientId", "checkedInAt");

-- CreateIndex
CREATE INDEX "ClientCheckIn_intakeSubmissionId_checkedInAt_idx" ON "ClientCheckIn"("intakeSubmissionId", "checkedInAt");

-- CreateIndex
CREATE INDEX "ClientCheckIn_branchId_checkedInAt_idx" ON "ClientCheckIn"("branchId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "ClientCheckIn" ADD CONSTRAINT "ClientCheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCheckIn" ADD CONSTRAINT "ClientCheckIn_intakeSubmissionId_fkey" FOREIGN KEY ("intakeSubmissionId") REFERENCES "IntakeFormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCheckIn" ADD CONSTRAINT "ClientCheckIn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
