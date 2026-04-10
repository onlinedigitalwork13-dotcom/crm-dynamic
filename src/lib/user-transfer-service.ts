import { prisma } from "@/lib/prisma";

export type TransferUserWorkInput = {
  fromUserId: string;
  toUserId: string;
  transferredByUserId: string;
  transferAssignedClients?: boolean;
  transferAssignedTasks?: boolean;
  transferAssignedLeads?: boolean;
  transferAssignedIntakeRequests?: boolean;
  transferAssignedIntakeSubmissions?: boolean;
  deactivateSourceUser?: boolean;
  notes?: string | null;
};

export type TransferUserWorkResult = {
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
  counts: {
    clients: number;
    tasks: number;
    leads: number;
    intakeRequests: number;
    intakeSubmissions: number;
  };
  deactivatedSourceUser: boolean;
};

function fullName(user: {
  firstName: string;
  lastName: string;
}) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export async function transferUserWork(
  input: TransferUserWorkInput
): Promise<TransferUserWorkResult> {
  const {
    fromUserId,
    toUserId,
    transferredByUserId,
    transferAssignedClients = true,
    transferAssignedTasks = true,
    transferAssignedLeads = true,
    transferAssignedIntakeRequests = true,
    transferAssignedIntakeSubmissions = true,
    deactivateSourceUser = false,
    notes = null,
  } = input;

  if (!fromUserId) {
    throw new Error("Source user is required.");
  }

  if (!toUserId) {
    throw new Error("Target user is required.");
  }

  if (!transferredByUserId) {
    throw new Error("Transferred by user is required.");
  }

  if (fromUserId === toUserId) {
    throw new Error("Source user and target user cannot be the same.");
  }

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: fromUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: toUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
      },
    }),
  ]);

  if (!fromUser) {
    throw new Error("Source user not found.");
  }

  if (!toUser) {
    throw new Error("Target user not found.");
  }

  if (!toUser.isActive) {
    throw new Error("Target user must be active.");
  }

  const result = await prisma.$transaction(async (tx) => {
    let clients = 0;
    let tasks = 0;
    let leads = 0;
    let intakeRequests = 0;
    let intakeSubmissions = 0;

    if (transferAssignedClients) {
      const update = await tx.client.updateMany({
        where: {
          assignedToId: fromUserId,
        },
        data: {
          assignedToId: toUserId,
        },
      });

      clients = update.count;
    }

    if (transferAssignedTasks) {
      const update = await tx.task.updateMany({
        where: {
          assignedToId: fromUserId,
        },
        data: {
          assignedToId: toUserId,
        },
      });

      tasks = update.count;
    }

    if (transferAssignedLeads) {
      const update = await tx.lead.updateMany({
        where: {
          assignedToId: fromUserId,
        },
        data: {
          assignedToId: toUserId,
        },
      });

      leads = update.count;
    }

    if (transferAssignedIntakeRequests) {
      const update = await tx.intakeFormRequest.updateMany({
        where: {
          assignedToId: fromUserId,
        },
        data: {
          assignedToId: toUserId,
        },
      });

      intakeRequests = update.count;
    }

    if (transferAssignedIntakeSubmissions) {
      const update = await tx.intakeFormSubmission.updateMany({
        where: {
          assignedToId: fromUserId,
        },
        data: {
          assignedToId: toUserId,
        },
      });

      intakeSubmissions = update.count;
    }

    if (deactivateSourceUser) {
      await tx.user.update({
        where: { id: fromUserId },
        data: {
          isActive: false,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: transferredByUserId,
        action: "user_work_transferred",
        entityType: "user",
        entityId: fromUserId,
        message: `Transferred work from ${fullName(fromUser)} to ${fullName(
          toUser
        )}`,
        metadata: {
          fromUserId,
          toUserId,
          transferAssignedClients,
          transferAssignedTasks,
          transferAssignedLeads,
          transferAssignedIntakeRequests,
          transferAssignedIntakeSubmissions,
          deactivateSourceUser,
          notes,
          counts: {
            clients,
            tasks,
            leads,
            intakeRequests,
            intakeSubmissions,
          },
        },
      },
    });

    return {
      fromUser: {
        id: fromUser.id,
        name: fullName(fromUser),
        email: fromUser.email,
      },
      toUser: {
        id: toUser.id,
        name: fullName(toUser),
        email: toUser.email,
      },
      counts: {
        clients,
        tasks,
        leads,
        intakeRequests,
        intakeSubmissions,
      },
      deactivatedSourceUser: deactivateSourceUser,
    };
  });

  return result;
}