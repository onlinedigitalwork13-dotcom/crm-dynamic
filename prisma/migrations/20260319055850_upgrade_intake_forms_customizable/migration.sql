/*
  Warnings:

  - The values [shared,submitted,assigned,converted,closed] on the enum `IntakeFormRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending_review,reviewed] on the enum `IntakeFormSubmissionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `closedAt` on the `IntakeFormRequest` table. All the data in the column will be lost.
  - You are about to drop the column `convertedAt` on the `IntakeFormRequest` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `IntakeFormRequest` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevel` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `englishTestScore` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `englishTestStatus` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `fundingSource` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `interestedCountry` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `interestedCourse` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `passportStatus` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `preferredIntake` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `preferredYear` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `studyLevel` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `workExperience` on the `IntakeFormSubmission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[originalIntakeSubmissionId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IntakeFormRequestStatus_new" AS ENUM ('draft', 'active', 'inactive', 'archived');
ALTER TABLE "public"."IntakeFormRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "IntakeFormRequest" ALTER COLUMN "status" TYPE "IntakeFormRequestStatus_new" USING ("status"::text::"IntakeFormRequestStatus_new");
ALTER TYPE "IntakeFormRequestStatus" RENAME TO "IntakeFormRequestStatus_old";
ALTER TYPE "IntakeFormRequestStatus_new" RENAME TO "IntakeFormRequestStatus";
DROP TYPE "public"."IntakeFormRequestStatus_old";
ALTER TABLE "IntakeFormRequest" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "IntakeFormSubmissionStatus_new" AS ENUM ('new', 'assigned', 'contacted', 'under_review', 'converted', 'closed');
ALTER TABLE "public"."IntakeFormSubmission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "IntakeFormSubmission" ALTER COLUMN "status" TYPE "IntakeFormSubmissionStatus_new" USING ("status"::text::"IntakeFormSubmissionStatus_new");
ALTER TYPE "IntakeFormSubmissionStatus" RENAME TO "IntakeFormSubmissionStatus_old";
ALTER TYPE "IntakeFormSubmissionStatus_new" RENAME TO "IntakeFormSubmissionStatus";
DROP TYPE "public"."IntakeFormSubmissionStatus_old";
ALTER TABLE "IntakeFormSubmission" ALTER COLUMN "status" SET DEFAULT 'new';
COMMIT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "originalIntakeSubmissionId" TEXT;

-- AlterTable
ALTER TABLE "IntakeFormRequest" DROP COLUMN "closedAt",
DROP COLUMN "convertedAt",
DROP COLUMN "submittedAt",
ADD COLUMN     "formSchema" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "submitButtonText" TEXT DEFAULT 'Submit',
ADD COLUMN     "successMessage" TEXT DEFAULT 'Thank you. Your form has been submitted successfully.';

-- AlterTable
ALTER TABLE "IntakeFormSubmission" DROP COLUMN "budget",
DROP COLUMN "educationLevel",
DROP COLUMN "englishTestScore",
DROP COLUMN "englishTestStatus",
DROP COLUMN "fundingSource",
DROP COLUMN "interestedCountry",
DROP COLUMN "interestedCourse",
DROP COLUMN "passportStatus",
DROP COLUMN "preferredIntake",
DROP COLUMN "preferredYear",
DROP COLUMN "studyLevel",
DROP COLUMN "workExperience",
ADD COLUMN     "answers" JSONB,
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "submissionMeta" JSONB,
ADD COLUMN     "submittedFiles" JSONB,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'new';

-- CreateIndex
CREATE UNIQUE INDEX "Client_originalIntakeSubmissionId_key" ON "Client"("originalIntakeSubmissionId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_originalIntakeSubmissionId_fkey" FOREIGN KEY ("originalIntakeSubmissionId") REFERENCES "IntakeFormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
