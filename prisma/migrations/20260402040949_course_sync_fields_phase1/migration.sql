/*
  Warnings:

  - You are about to drop the column `externalCourseId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `intakeDetails` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `sourceHash` on the `Course` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Course_campus_idx";

-- DropIndex
DROP INDEX "Course_externalCourseId_idx";

-- DropIndex
DROP INDEX "Course_isActive_idx";

-- DropIndex
DROP INDEX "Course_lastSyncedAt_idx";

-- DropIndex
DROP INDEX "Course_level_idx";

-- DropIndex
DROP INDEX "Course_sourceType_idx";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "externalCourseId",
DROP COLUMN "intakeDetails",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "sourceHash";
