-- CreateEnum
CREATE TYPE "NotificationEventStatus" AS ENUM ('pending', 'processing', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'in_app', 'both');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('resend', 'suprsend', 'system');

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('client', 'assigned_user', 'branch_admin', 'staff');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('pending', 'sent', 'failed', 'delivered', 'opened');

-- CreateEnum
CREATE TYPE "ClientCommunicationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "status" "NotificationEventStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "workflowId" TEXT,
    "clientId" TEXT,
    "taskId" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT,
    "eventType" TEXT NOT NULL,
    "targetType" "NotificationTargetType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationEventId" TEXT NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "targetType" "NotificationTargetType",
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'pending',
    "subject" TEXT,
    "body" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCommunication" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "applicationId" TEXT,
    "provider" "NotificationProvider" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "deliveryStatus" "ClientCommunicationStatus" NOT NULL DEFAULT 'pending',
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_idx" ON "NotificationEvent"("eventType");

-- CreateIndex
CREATE INDEX "NotificationEvent_entityType_entityId_idx" ON "NotificationEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "NotificationEvent_status_idx" ON "NotificationEvent"("status");

-- CreateIndex
CREATE INDEX "NotificationEvent_workflowId_idx" ON "NotificationEvent"("workflowId");

-- CreateIndex
CREATE INDEX "NotificationEvent_clientId_idx" ON "NotificationEvent"("clientId");

-- CreateIndex
CREATE INDEX "NotificationEvent_taskId_idx" ON "NotificationEvent"("taskId");

-- CreateIndex
CREATE INDEX "NotificationEvent_applicationId_idx" ON "NotificationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "NotificationEvent_createdAt_idx" ON "NotificationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_workflowId_idx" ON "WorkflowAutomationRule"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_fromStageId_idx" ON "WorkflowAutomationRule"("fromStageId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_toStageId_idx" ON "WorkflowAutomationRule"("toStageId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_eventType_idx" ON "WorkflowAutomationRule"("eventType");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_isActive_idx" ON "WorkflowAutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationEventId_idx" ON "NotificationDelivery"("notificationEventId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_provider_idx" ON "NotificationDelivery"("provider");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_idx" ON "NotificationDelivery"("channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_recipient_idx" ON "NotificationDelivery"("recipient");

-- CreateIndex
CREATE INDEX "NotificationDelivery_createdAt_idx" ON "NotificationDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "ClientCommunication_clientId_idx" ON "ClientCommunication"("clientId");

-- CreateIndex
CREATE INDEX "ClientCommunication_applicationId_idx" ON "ClientCommunication"("applicationId");

-- CreateIndex
CREATE INDEX "ClientCommunication_provider_idx" ON "ClientCommunication"("provider");

-- CreateIndex
CREATE INDEX "ClientCommunication_channel_idx" ON "ClientCommunication"("channel");

-- CreateIndex
CREATE INDEX "ClientCommunication_deliveryStatus_idx" ON "ClientCommunication"("deliveryStatus");

-- CreateIndex
CREATE INDEX "ClientCommunication_createdAt_idx" ON "ClientCommunication"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ClientApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRule" ADD CONSTRAINT "WorkflowAutomationRule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRule" ADD CONSTRAINT "WorkflowAutomationRule_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRule" ADD CONSTRAINT "WorkflowAutomationRule_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationEventId_fkey" FOREIGN KEY ("notificationEventId") REFERENCES "NotificationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCommunication" ADD CONSTRAINT "ClientCommunication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCommunication" ADD CONSTRAINT "ClientCommunication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ClientApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
