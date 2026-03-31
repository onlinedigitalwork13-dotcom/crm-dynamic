import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { createClientSchema } from "@/lib/validators/client";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";
import { stripCoreClientFields } from "@/lib/clients/strip-core-client-fields";

export async function GET() {
  try {
    const session = await requireApiAuth();

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;
    const currentUserId = session.user.id;

    const where = isAdmin(roleName)
      ? {}
      : hasBranchScopedAccess(roleName, branchId)
      ? {
          OR: [
            ...(branchId ? [{ branchId }] : []),
            { assignedToId: currentUserId },
            { createdById: currentUserId },
          ],
        }
      : (() => {
          throw new ApiError("Forbidden", 403);
        })();

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passport: true,
        branchId: true,
        createdById: true,
        assignedToId: true,
        sourceId: true,
        workflowId: true,
        currentStageId: true,
        subagentId: true,
        profileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(clients);
  } catch (error) {
    console.error("Clients GET error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiAuth();

    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid client data", 400, parsed.error.flatten());
    }

    const roleName = session.user.roleName;
    const sessionBranchId = session.user.branchId ?? null;
    const currentUserId = session.user.id;

    let finalBranchId = parsed.data.branchId ?? null;

    if (!isAdmin(roleName)) {
      if (!sessionBranchId) {
        throw new ApiError("Forbidden", 403);
      }

      finalBranchId = sessionBranchId;
    }

    const cleanedProfileData = stripCoreClientFields(
      parsed.data.profileData as Record<string, unknown> | undefined
    );

    const client = await prisma.client.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone,
        passport: parsed.data.passport ?? null,
        branchId: finalBranchId,
        sourceId: parsed.data.sourceId ?? null,
        workflowId: parsed.data.workflowId ?? null,
        currentStageId: parsed.data.currentStageId ?? null,
        subagentId: parsed.data.subagentId ?? null,
        createdById: currentUserId,
        assignedToId: currentUserId,
        profileData: cleanedProfileData
          ? (cleanedProfileData as Prisma.InputJsonValue)
          : undefined,
      },
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
        createdById: true,
        assignedToId: true,
        profileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "client.created",
      entityType: "client",
      entityId: client.id,
      message: `Client ${client.firstName} ${client.lastName} created`,
      metadata: {
        branchId: client.branchId,
        sourceId: client.sourceId,
        workflowId: client.workflowId,
        subagentId: client.subagentId,
        createdById: client.createdById,
        assignedToId: client.assignedToId,
        hasProfileData: !!client.profileData,
      },
    });

    return ok(client, 201);
  } catch (error) {
    console.error("Clients POST error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}