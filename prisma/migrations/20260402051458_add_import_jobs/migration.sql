-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceValue" TEXT,
    "status" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJobRow" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rawRowIndex" INTEGER,
    "providerName" TEXT,
    "courseName" TEXT,
    "payloadJson" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "wasImported" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJobRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_type_idx" ON "ImportJob"("type");

-- CreateIndex
CREATE INDEX "ImportJob_sourceType_idx" ON "ImportJob"("sourceType");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdById_idx" ON "ImportJob"("createdById");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJobRow_importJobId_idx" ON "ImportJobRow"("importJobId");

-- CreateIndex
CREATE INDEX "ImportJobRow_rawRowIndex_idx" ON "ImportJobRow"("rawRowIndex");

-- CreateIndex
CREATE INDEX "ImportJobRow_isValid_idx" ON "ImportJobRow"("isValid");

-- CreateIndex
CREATE INDEX "ImportJobRow_isDuplicate_idx" ON "ImportJobRow"("isDuplicate");

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJobRow" ADD CONSTRAINT "ImportJobRow_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
