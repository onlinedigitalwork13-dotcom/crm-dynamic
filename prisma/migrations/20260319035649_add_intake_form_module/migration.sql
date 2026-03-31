-- CreateEnum
CREATE TYPE "IntakeFormRequestStatus" AS ENUM ('draft', 'shared', 'submitted', 'assigned', 'converted', 'closed');

-- CreateEnum
CREATE TYPE "IntakeFormSubmissionStatus" AS ENUM ('pending_review', 'assigned', 'reviewed', 'converted', 'closed');

-- CreateTable
CREATE TABLE "IntakeFormRequest" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IntakeFormRequestStatus" NOT NULL DEFAULT 'draft',
    "publicUrl" TEXT,
    "qrCodeValue" TEXT,
    "sharedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeFormRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeFormSubmission" (
    "id" TEXT NOT NULL,
    "intakeFormRequestId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "reviewedById" TEXT,
    "clientId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "interestedCountry" TEXT,
    "interestedCourse" TEXT,
    "studyLevel" TEXT,
    "preferredIntake" TEXT,
    "preferredYear" INTEGER,
    "englishTestStatus" TEXT,
    "englishTestScore" TEXT,
    "passportStatus" TEXT,
    "passportNumber" TEXT,
    "educationLevel" TEXT,
    "workExperience" TEXT,
    "budget" TEXT,
    "fundingSource" TEXT,
    "notes" TEXT,
    "status" "IntakeFormSubmissionStatus" NOT NULL DEFAULT 'pending_review',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeFormRequest_token_key" ON "IntakeFormRequest"("token");

-- CreateIndex
CREATE INDEX "IntakeFormRequest_branchId_idx" ON "IntakeFormRequest"("branchId");

-- CreateIndex
CREATE INDEX "IntakeFormRequest_createdById_idx" ON "IntakeFormRequest"("createdById");

-- CreateIndex
CREATE INDEX "IntakeFormRequest_assignedToId_idx" ON "IntakeFormRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "IntakeFormRequest_status_idx" ON "IntakeFormRequest"("status");

-- CreateIndex
CREATE INDEX "IntakeFormRequest_token_idx" ON "IntakeFormRequest"("token");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_intakeFormRequestId_idx" ON "IntakeFormSubmission"("intakeFormRequestId");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_branchId_idx" ON "IntakeFormSubmission"("branchId");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_assignedToId_idx" ON "IntakeFormSubmission"("assignedToId");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_reviewedById_idx" ON "IntakeFormSubmission"("reviewedById");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_clientId_idx" ON "IntakeFormSubmission"("clientId");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_status_idx" ON "IntakeFormSubmission"("status");

-- CreateIndex
CREATE INDEX "IntakeFormSubmission_submittedAt_idx" ON "IntakeFormSubmission"("submittedAt");

-- AddForeignKey
ALTER TABLE "IntakeFormRequest" ADD CONSTRAINT "IntakeFormRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormRequest" ADD CONSTRAINT "IntakeFormRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormRequest" ADD CONSTRAINT "IntakeFormRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_intakeFormRequestId_fkey" FOREIGN KEY ("intakeFormRequestId") REFERENCES "IntakeFormRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormSubmission" ADD CONSTRAINT "IntakeFormSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
