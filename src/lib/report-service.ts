import { prisma } from "@/lib/prisma";

type StaffCaseItem = {
  clientId: string;
  clientName: string;
  workflowName: string;
  stageName: string;
  isFinalStage: boolean;
  updatedAt: Date;
  branchName: string;
};

type StaffSummary = {
  userId: string;
  staffName: string;
  email: string;
  totalAssignedClients: number;
  activeClients: number;
  finalStageClients: number;
  convertedClients: number;
  openTasks: number;
  cases: StaffCaseItem[];
};

type WorkflowStageCount = {
  workflowId: string;
  workflowName: string;
  stageId: string;
  stageName: string;
  isFinal: boolean;
  clientCount: number;
};

type RecentConvertedClient = {
  id: string;
  clientName: string;
  workflowName: string;
  stageName: string;
  assignedStaffName: string;
  updatedAt: Date;
};

type ConversionTrendItem = {
  monthKey: string;
  monthLabel: string;
  convertedCount: number;
};

export type ReportsOverviewData = {
  totalClients: number;
  activeClients: number;
  finalStageClients: number;
  convertedThisMonth: number;
  totalAssignedCases: number;
  avgCasesPerStaff: number;
  topPerformer: {
    name: string;
    convertedClients: number;
  } | null;
  staffPerformance: StaffSummary[];
  workflowStageCounts: WorkflowStageCount[];
  recentConvertedClients: RecentConvertedClient[];
  conversionTrend: ConversionTrendItem[];
};

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export async function getReportsOverview(): Promise<ReportsOverviewData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalClients,
    assignedClients,
    staffUsers,
    openTasks,
    recentConvertedClientsRaw,
    workflowStageCountsRaw,
  ] = await Promise.all([
    prisma.client.count(),

    prisma.client.findMany({
      where: {
        assignedToId: {
          not: undefined,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedToId: true,
        updatedAt: true,
        branch: {
          select: {
            name: true,
          },
        },
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        currentStage: {
          select: {
            id: true,
            stageName: true,
            isFinal: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),

    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: {
            in: ["staff", "branch_manager", "counsellor", "admin", "super_admin"],
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),

    prisma.task.findMany({
      where: {
        status: {
          not: "completed",
        },
      },
      select: {
        assignedToId: true,
      },
    }),

    prisma.client.findMany({
      where: {
        currentStage: {
          is: {
            isFinal: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
        workflow: {
          select: {
            name: true,
          },
        },
        currentStage: {
          select: {
            stageName: true,
            isFinal: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
    }),

    prisma.workflowStage.findMany({
      select: {
        id: true,
        stageName: true,
        isFinal: true,
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        currentClients: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        {
          workflow: {
            name: "asc",
          },
        },
        {
          orderSequence: "asc",
        },
      ],
    }),
  ]);

  const openTaskMap = new Map<string, number>();
  for (const task of openTasks) {
    if (!task.assignedToId) continue;
    openTaskMap.set(
      task.assignedToId,
      (openTaskMap.get(task.assignedToId) ?? 0) + 1
    );
  }

  const staffSummaryMap = new Map<string, StaffSummary>();

  for (const user of staffUsers) {
    staffSummaryMap.set(user.id, {
      userId: user.id,
      staffName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      totalAssignedClients: 0,
      activeClients: 0,
      finalStageClients: 0,
      convertedClients: 0,
      openTasks: openTaskMap.get(user.id) ?? 0,
      cases: [],
    });
  }

  let finalStageClients = 0;

  for (const client of assignedClients) {
    if (!client.assignedToId) continue;

    const summary = staffSummaryMap.get(client.assignedToId);
    if (!summary) continue;

    const isFinalStage = Boolean(client.currentStage?.isFinal);
    const workflowName = client.workflow?.name || "Unassigned Workflow";
    const stageName = client.currentStage?.stageName || "No Stage";

    summary.totalAssignedClients += 1;

    if (isFinalStage) {
      summary.finalStageClients += 1;
      summary.convertedClients += 1;
      finalStageClients += 1;
    } else {
      summary.activeClients += 1;
    }

    summary.cases.push({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`.trim(),
      workflowName,
      stageName,
      isFinalStage,
      updatedAt: client.updatedAt,
      branchName: client.branch?.name || "No branch",
    });
  }

  const staffPerformance = Array.from(staffSummaryMap.values())
    .filter(
      (item) =>
        item.totalAssignedClients > 0 ||
        item.openTasks > 0 ||
        item.cases.length > 0
    )
    .sort((a, b) => {
      if (b.convertedClients !== a.convertedClients) {
        return b.convertedClients - a.convertedClients;
      }

      return b.totalAssignedClients - a.totalAssignedClients;
    });

  const totalAssignedCases = staffPerformance.reduce(
    (sum, item) => sum + item.totalAssignedClients,
    0
  );

  const avgCasesPerStaff =
    staffPerformance.length > 0
      ? Number((totalAssignedCases / staffPerformance.length).toFixed(1))
      : 0;

  const topPerformer =
    staffPerformance.length > 0
      ? {
          name: staffPerformance[0].staffName,
          convertedClients: staffPerformance[0].convertedClients,
        }
      : null;

  const convertedThisMonth = recentConvertedClientsRaw.filter(
    (client) => client.updatedAt >= monthStart
  ).length;

  const recentConvertedClients: RecentConvertedClient[] =
    recentConvertedClientsRaw.slice(0, 8).map((client) => ({
      id: client.id,
      clientName: `${client.firstName} ${client.lastName}`.trim(),
      workflowName: client.workflow?.name || "Unassigned Workflow",
      stageName: client.currentStage?.stageName || "Final Stage",
      assignedStaffName: client.assignedTo
        ? `${client.assignedTo.firstName} ${client.assignedTo.lastName}`.trim()
        : "Unassigned",
      updatedAt: client.updatedAt,
    }));

  const workflowStageCounts: WorkflowStageCount[] = workflowStageCountsRaw.map(
    (stage) => ({
      workflowId: stage.workflow.id,
      workflowName: stage.workflow.name,
      stageId: stage.id,
      stageName: stage.stageName,
      isFinal: stage.isFinal,
      clientCount: stage.currentClients.length,
    })
  );

  const conversionTrendMap = new Map<string, number>();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    conversionTrendMap.set(key, 0);
  }

  for (const client of recentConvertedClientsRaw) {
    const key = `${client.updatedAt.getFullYear()}-${client.updatedAt.getMonth() + 1}`;
    if (conversionTrendMap.has(key)) {
      conversionTrendMap.set(key, (conversionTrendMap.get(key) ?? 0) + 1);
    }
  }

  const conversionTrend: ConversionTrendItem[] = Array.from(
    conversionTrendMap.entries()
  ).map(([monthKey, convertedCount]) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    return {
      monthKey,
      monthLabel: formatMonthLabel(date),
      convertedCount,
    };
  });

  return {
    totalClients,
    activeClients: Math.max(totalClients - finalStageClients, 0),
    finalStageClients,
    convertedThisMonth,
    totalAssignedCases,
    avgCasesPerStaff,
    topPerformer,
    staffPerformance,
    workflowStageCounts,
    recentConvertedClients,
    conversionTrend,
  };
}