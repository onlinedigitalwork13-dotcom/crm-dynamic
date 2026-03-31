-- CreateTable
CREATE TABLE "TaskAutomationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowId" TEXT,
    "triggerEventType" TEXT NOT NULL,
    "triggerStatus" TEXT,
    "sourceTaskTitle" TEXT,
    "sourceStageId" TEXT,
    "titleTemplate" TEXT NOT NULL,
    "descriptionTemplate" TEXT,
    "assignToType" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAutomationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAutomationTemplate_workflowId_idx" ON "TaskAutomationTemplate"("workflowId");

-- CreateIndex
CREATE INDEX "TaskAutomationTemplate_triggerEventType_idx" ON "TaskAutomationTemplate"("triggerEventType");

-- CreateIndex
CREATE INDEX "TaskAutomationTemplate_isActive_idx" ON "TaskAutomationTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "TaskAutomationTemplate" ADD CONSTRAINT "TaskAutomationTemplate_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
