-- CreateTable
CREATE TABLE "ClientApplication" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "intake" TEXT NOT NULL,
    "intakeYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "applicationNo" TEXT,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "offerDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientApplication_clientId_idx" ON "ClientApplication"("clientId");

-- CreateIndex
CREATE INDEX "ClientApplication_providerId_idx" ON "ClientApplication"("providerId");

-- CreateIndex
CREATE INDEX "ClientApplication_courseId_idx" ON "ClientApplication"("courseId");

-- CreateIndex
CREATE INDEX "ClientApplication_status_idx" ON "ClientApplication"("status");

-- CreateIndex
CREATE INDEX "ClientApplication_intake_intakeYear_idx" ON "ClientApplication"("intake", "intakeYear");

-- AddForeignKey
ALTER TABLE "ClientApplication" ADD CONSTRAINT "ClientApplication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientApplication" ADD CONSTRAINT "ClientApplication_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientApplication" ADD CONSTRAINT "ClientApplication_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
