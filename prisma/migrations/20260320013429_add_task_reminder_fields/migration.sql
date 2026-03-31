-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
