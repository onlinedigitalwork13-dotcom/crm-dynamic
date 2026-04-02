-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "applicationFee" DOUBLE PRECISION,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "durationUnit" TEXT,
ADD COLUMN     "durationValue" DOUBLE PRECISION,
ADD COLUMN     "englishRequirements" TEXT,
ADD COLUMN     "entryRequirements" TEXT,
ADD COLUMN     "externalCourseId" TEXT,
ADD COLUMN     "intakeDetails" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "materialFee" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sourceHash" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "studyMode" TEXT,
ADD COLUMN     "syncStatus" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "address" TEXT,
ADD COLUMN     "admissionEmail" TEXT,
ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCurrency" TEXT,
ADD COLUMN     "financeEmail" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncMessage" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "portalUrl" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "supportPhone" TEXT,
ADD COLUMN     "syncStatus" TEXT;

-- CreateTable
CREATE TABLE "ProviderContact" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCampus" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCampus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSyncSource" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "name" TEXT,
    "endpointUrl" TEXT,
    "authType" TEXT,
    "authConfig" JSONB,
    "mappingConfig" JSONB,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSyncSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSyncLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "syncSourceId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "archivedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "rawSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderContact_providerId_idx" ON "ProviderContact"("providerId");

-- CreateIndex
CREATE INDEX "ProviderContact_isPrimary_idx" ON "ProviderContact"("isPrimary");

-- CreateIndex
CREATE INDEX "ProviderContact_isActive_idx" ON "ProviderContact"("isActive");

-- CreateIndex
CREATE INDEX "ProviderContact_email_idx" ON "ProviderContact"("email");

-- CreateIndex
CREATE INDEX "ProviderCampus_providerId_idx" ON "ProviderCampus"("providerId");

-- CreateIndex
CREATE INDEX "ProviderCampus_isActive_idx" ON "ProviderCampus"("isActive");

-- CreateIndex
CREATE INDEX "ProviderCampus_city_idx" ON "ProviderCampus"("city");

-- CreateIndex
CREATE INDEX "ProviderCampus_country_idx" ON "ProviderCampus"("country");

-- CreateIndex
CREATE INDEX "ProviderSyncSource_providerId_idx" ON "ProviderSyncSource"("providerId");

-- CreateIndex
CREATE INDEX "ProviderSyncSource_sourceType_idx" ON "ProviderSyncSource"("sourceType");

-- CreateIndex
CREATE INDEX "ProviderSyncSource_isActive_idx" ON "ProviderSyncSource"("isActive");

-- CreateIndex
CREATE INDEX "ProviderSyncSource_lastSyncAt_idx" ON "ProviderSyncSource"("lastSyncAt");

-- CreateIndex
CREATE INDEX "ProviderSyncSource_lastSyncStatus_idx" ON "ProviderSyncSource"("lastSyncStatus");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_providerId_idx" ON "ProviderSyncLog"("providerId");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_syncSourceId_idx" ON "ProviderSyncLog"("syncSourceId");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_status_idx" ON "ProviderSyncLog"("status");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_startedAt_idx" ON "ProviderSyncLog"("startedAt");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_createdAt_idx" ON "ProviderSyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");

-- CreateIndex
CREATE INDEX "Course_campus_idx" ON "Course"("campus");

-- CreateIndex
CREATE INDEX "Course_sourceType_idx" ON "Course"("sourceType");

-- CreateIndex
CREATE INDEX "Course_lastSyncedAt_idx" ON "Course"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "Course_externalCourseId_idx" ON "Course"("externalCourseId");

-- CreateIndex
CREATE INDEX "Provider_isActive_idx" ON "Provider"("isActive");

-- CreateIndex
CREATE INDEX "Provider_country_idx" ON "Provider"("country");

-- CreateIndex
CREATE INDEX "Provider_city_idx" ON "Provider"("city");

-- CreateIndex
CREATE INDEX "Provider_syncStatus_idx" ON "Provider"("syncStatus");

-- CreateIndex
CREATE INDEX "Provider_lastSyncAt_idx" ON "Provider"("lastSyncAt");

-- AddForeignKey
ALTER TABLE "ProviderContact" ADD CONSTRAINT "ProviderContact_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCampus" ADD CONSTRAINT "ProviderCampus_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSyncSource" ADD CONSTRAINT "ProviderSyncSource_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSyncLog" ADD CONSTRAINT "ProviderSyncLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSyncLog" ADD CONSTRAINT "ProviderSyncLog_syncSourceId_fkey" FOREIGN KEY ("syncSourceId") REFERENCES "ProviderSyncSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
