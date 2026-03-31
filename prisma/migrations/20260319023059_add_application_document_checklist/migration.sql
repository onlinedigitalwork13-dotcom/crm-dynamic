-- CreateEnum
CREATE TYPE "ApplicationChecklistStatus" AS ENUM ('pending', 'requested', 'received', 'verified', 'rejected', 'waived');

-- CreateTable
CREATE TABLE "DocumentRequirementTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowMulti" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequirementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationChecklistItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "ApplicationChecklistStatus" NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "dueDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationChecklistDocument" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationChecklistDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirementTemplate_code_key" ON "DocumentRequirementTemplate"("code");

-- CreateIndex
CREATE INDEX "ApplicationChecklistItem_applicationId_idx" ON "ApplicationChecklistItem"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationChecklistItem_templateId_idx" ON "ApplicationChecklistItem"("templateId");

-- CreateIndex
CREATE INDEX "ApplicationChecklistItem_verifiedById_idx" ON "ApplicationChecklistItem"("verifiedById");

-- CreateIndex
CREATE INDEX "ApplicationChecklistDocument_checklistItemId_idx" ON "ApplicationChecklistDocument"("checklistItemId");

-- CreateIndex
CREATE INDEX "ApplicationChecklistDocument_uploadedById_idx" ON "ApplicationChecklistDocument"("uploadedById");

-- AddForeignKey
ALTER TABLE "ApplicationChecklistItem" ADD CONSTRAINT "ApplicationChecklistItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ClientApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationChecklistItem" ADD CONSTRAINT "ApplicationChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentRequirementTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationChecklistItem" ADD CONSTRAINT "ApplicationChecklistItem_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationChecklistDocument" ADD CONSTRAINT "ApplicationChecklistDocument_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ApplicationChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationChecklistDocument" ADD CONSTRAINT "ApplicationChecklistDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
