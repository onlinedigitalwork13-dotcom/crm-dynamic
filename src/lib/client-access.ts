import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";

type AccessContext = {
  userId: string;
  roleName?: string | null;
  branchId?: string | null;
};

export async function getAccessibleClientOrThrow(
  clientId: string,
  context: AccessContext
) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passport: true,
      branchId: true,
      sourceId: true,
      workflowId: true,
      currentStageId: true,
      subagentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!client) {
    throw new ApiError("Client not found", 404);
  }

  if (isAdmin(context.roleName)) {
    return client;
  }

  if (hasBranchScopedAccess(context.roleName, context.branchId)) {
    if (client.branchId !== context.branchId) {
      throw new ApiError("Forbidden", 403);
    }

    return client;
  }

  throw new ApiError("Forbidden", 403);
}