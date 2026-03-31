-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "duration" TEXT,
    "tuitionFee" DOUBLE PRECISION,
    "intakeMonths" TEXT,
    "campus" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Course_providerId_idx" ON "Course"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_providerId_name_key" ON "Course"("providerId", "name");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
