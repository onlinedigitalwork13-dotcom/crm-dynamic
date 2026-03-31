import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { updateClientSchema } from "@/lib/validators/client";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await params;

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const client = await prisma.client.findUnique({
      where: { id },
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
        profileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    if (!isAdmin(roleName) && !hasBranchScopedAccess(roleName, branchId)) {
      throw new ApiError("Forbidden", 403);
    }

    if (!isAdmin(roleName) && client.branchId !== branchId) {
      throw new ApiError("Forbidden", 403);
    }

    return ok(client);
  } catch (error) {
    console.error("Client GET by id error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid client data", 400, parsed.error.flatten());
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
      },
    });

    if (!existingClient) {
      throw new ApiError("Client not found", 404);
    }

    const roleName = session.user.roleName;
    const sessionBranchId = session.user.branchId ?? null;

    if (!isAdmin(roleName)) {
      if (!hasBranchScopedAccess(roleName, sessionBranchId)) {
        throw new ApiError("Forbidden", 403);
      }

      if (existingClient.branchId !== sessionBranchId) {
        throw new ApiError("Forbidden", 403);
      }
    }

    let finalBranchId = parsed.data.branchId;

    if (!isAdmin(roleName)) {
      finalBranchId = sessionBranchId ?? undefined;
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email ?? undefined,
        phone: parsed.data.phone,
        passport: parsed.data.passport ?? undefined,
        branchId: finalBranchId ?? undefined,
        sourceId: parsed.data.sourceId ?? undefined,
        workflowId: parsed.data.workflowId ?? undefined,
        currentStageId: parsed.data.currentStageId ?? undefined,
        subagentId: parsed.data.subagentId ?? undefined,
        profileData: parsed.data.profileData
          ? (parsed.data.profileData as Prisma.InputJsonValue)
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
        profileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "client.updated",
      entityType: "client",
      entityId: client.id,
      message: `Client ${client.firstName} ${client.lastName} updated`,
      metadata: {
        branchId: client.branchId,
        sourceId: client.sourceId,
        workflowId: client.workflowId,
        subagentId: client.subagentId,
        hasProfileData: !!client.profileData,
      },
    });

    return ok(client);
  } catch (error) {
    console.error("Client PATCH error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}