import { prisma } from "@/lib/prisma";

function normalizeNullableString(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: string, fieldLabel: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return trimmed;
}

const workflowDetailInclude = {
  stages: {
    orderBy: {
      orderSequence: "asc" as const,
    },
  },
  automationRules: {
    orderBy: {
      createdAt: "desc" as const,
    },
    include: {
      fromStage: {
        select: {
          id: true,
          stageName: true,
          orderSequence: true,
          isFinal: true,
        },
      },
      toStage: {
        select: {
          id: true,
          stageName: true,
          orderSequence: true,
          isFinal: true,
        },
      },
    },
  },
  taskAutomationTemplates: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  _count: {
    select: {
      clients: true,
      stages: true,
      automationRules: true,
      taskAutomationTemplates: true,
      notificationEvents: true,
    },
  },
};

export async function getWorkflows() {
  return prisma.workflow.findMany({
    include: workflowDetailInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActiveWorkflows() {
  return prisma.workflow.findMany({
    where: {
      isActive: true,
    },
    include: workflowDetailInclude,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getWorkflowOptions() {
  return prisma.workflow.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getWorkflowById(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: workflowDetailInclude,
  });

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  return workflow;
}

export async function getWorkflowSummaryById(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          stages: true,
          clients: true,
          automationRules: true,
          taskAutomationTemplates: true,
          notificationEvents: true,
        },
      },
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  return workflow;
}

export async function getWorkflowWithRelations(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: workflowDetailInclude,
  });

  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  return workflow;
}

export async function createWorkflow(data: {
  name: string;
  description?: string | null;
  isActive?: boolean;
}) {
  const name = normalizeRequiredString(data.name, "Workflow name");

  const existing = await prisma.workflow.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("Workflow already exists.");
  }

  return prisma.workflow.create({
    data: {
      name,
      description: normalizeNullableString(data.description) ?? null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }
) {
  const existing = await prisma.workflow.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Workflow not found.");
  }

  if (data.name !== undefined) {
    const trimmedName = normalizeRequiredString(data.name, "Workflow name");

    const duplicate = await prisma.workflow.findFirst({
      where: {
        name: trimmedName,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new Error("Another workflow with this name already exists.");
    }
  }

  return prisma.workflow.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      description: normalizeNullableString(data.description),
      isActive: data.isActive,
    },
  });
}

export async function toggleWorkflowActiveState(id: string, isActive: boolean) {
  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Workflow not found.");
  }

  return prisma.workflow.update({
    where: { id },
    data: {
      isActive,
    },
  });
}

export async function validateWorkflowStageSequence(workflowId: string) {
  const stages = await prisma.workflowStage.findMany({
    where: {
      workflowId,
    },
    orderBy: {
      orderSequence: "asc",
    },
    select: {
      id: true,
      stageName: true,
      orderSequence: true,
      isFinal: true,
    },
  });

  const duplicateSequences = new Set<number>();
  const seen = new Set<number>();

  for (const stage of stages) {
    if (seen.has(stage.orderSequence)) {
      duplicateSequences.add(stage.orderSequence);
    }
    seen.add(stage.orderSequence);
  }

  const finalStages = stages.filter((stage) => stage.isFinal);

  return {
    stages,
    hasDuplicateSequences: duplicateSequences.size > 0,
    duplicateSequences: Array.from(duplicateSequences).sort((a, b) => a - b),
    finalStageCount: finalStages.length,
    hasSingleFinalStage: finalStages.length === 1,
  };
}

export async function deleteWorkflow(id: string) {
  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          clients: true,
          stages: true,
          automationRules: true,
          taskAutomationTemplates: true,
          notificationEvents: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Workflow not found.");
  }

  if (existing._count.clients > 0) {
    throw new Error(
      "This workflow is currently assigned to clients and cannot be deleted."
    );
  }

  return prisma.workflow.delete({
    where: { id },
  });
}