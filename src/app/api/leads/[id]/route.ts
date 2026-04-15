import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await params;

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
        clientId: true,
        intakeSubmissionId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!lead) {
      throw new ApiError("Lead not found", 404);
    }

    if (!isAdmin(roleName)) {
      if (!hasBranchScopedAccess(roleName, branchId)) {
        throw new ApiError("Forbidden", 403);
      }

      if (lead.branchId !== branchId) {
        throw new ApiError("Forbidden", 403);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadFollower.deleteMany({
        where: { leadId: id },
      });

      await tx.leadActivity.deleteMany({
        where: { leadId: id },
      });

      if (lead.intakeSubmissionId) {
        await tx.intakeFormSubmission.update({
          where: { id: lead.intakeSubmissionId },
          data: {
            clientId: null,
          },
        });
      }

      await tx.lead.delete({
        where: { id },
      });
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "lead.deleted",
      entityType: "lead",
      entityId: id,
      message: `Lead ${lead.firstName || ""} ${lead.lastName || ""}`.trim()
        ? `Lead ${lead.firstName || ""} ${lead.lastName || ""}`.trim() + " deleted"
        : "Lead deleted",
      metadata: {
        branchId: lead.branchId,
        clientId: lead.clientId,
        intakeSubmissionId: lead.intakeSubmissionId,
      },
    });

    return ok({ success: true });
  } catch (error) {
    console.error("Lead DELETE error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Failed to delete lead",
      500
    );
  }
}