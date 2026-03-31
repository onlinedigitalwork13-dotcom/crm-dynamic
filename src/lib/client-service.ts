import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function normalizeRole(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

export async function getClients() {
  const session = await requireAuth();

  const currentUserId = session.user.id;
  const currentUserRole = normalizeRole(session.user.roleName);
  const currentUserBranchId = session.user.branchId ?? null;

  const canManageAll =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  return prisma.client.findMany({
    where: canManageAll
      ? undefined
      : {
          OR: [
            ...(currentUserBranchId ? [{ branchId: currentUserBranchId }] : []),
            { assignedToId: currentUserId },
            { createdById: currentUserId },
          ],
        },
    include: {
      source: true,
      workflow: true,
      currentStage: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}