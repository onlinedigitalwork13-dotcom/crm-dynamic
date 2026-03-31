-- CreateTable
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationTemplate_key_key" ON "CommunicationTemplate"("key");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_key_idx" ON "CommunicationTemplate"("key");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_channel_idx" ON "CommunicationTemplate"("channel");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_isActive_idx" ON "CommunicationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_createdAt_idx" ON "CommunicationTemplate"("createdAt");
