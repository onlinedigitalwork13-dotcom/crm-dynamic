import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";

type AccessContext = {
  userId: string;
  roleName?: string | null;
  branchId?: string | null;
};

export async function getAccessibleApplicationOrThrow(
  applicationId: string,
  context: AccessContext
) {
  const application = await prisma.clientApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      clientId: true,
      providerId: true,
      courseId: true,
      intake: true,
      intakeYear: true,
      status: true,
      applicationNo: true,
      notes: true,
      appliedAt: true,
      offerDate: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          branchId: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  if (isAdmin(context.roleName)) {
    return application;
  }

  if (hasBranchScopedAccess(context.roleName, context.branchId)) {
    if (application.client.branchId !== context.branchId) {
      throw new ApiError("Forbidden", 403);
    }
    return application;
  }

  throw new ApiError("Forbidden", 403);
}