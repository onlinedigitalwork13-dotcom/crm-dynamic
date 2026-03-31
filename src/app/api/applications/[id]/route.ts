import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { updateApplicationSchema } from "@/lib/validators/application";
import { isAdmin } from "@/lib/permissions";
import { getAccessibleApplicationOrThrow } from "@/lib/application-access";
import { createAuditLog } from "@/lib/audit-log-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;

    const application = await getAccessibleApplicationOrThrow(id, {
      userId: session.user.id,
      roleName: session.user.roleName,
      branchId: session.user.branchId ?? null,
    });

    return ok(application);
  } catch (error) {
    console.error("Application GET by id error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;

    await getAccessibleApplicationOrThrow(id, {
      userId: session.user.id,
      roleName: session.user.roleName,
      branchId: session.user.branchId ?? null,
    });

    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid application update data", 400, parsed.error.flatten());
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.clientId !== undefined) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { id: true, branchId: true },
      });

      if (!client) {
        throw new ApiError("Client not found", 404);
      }

      if (!isAdmin(session.user.roleName)) {
        const branchId = session.user.branchId ?? null;
        if (!branchId || client.branchId !== branchId) {
          throw new ApiError("Forbidden", 403);
        }
      }

      updateData.clientId = data.clientId;
    }

    if (data.providerId !== undefined) {
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId },
        select: { id: true },
      });

      if (!provider) {
        throw new ApiError("Provider not found", 404);
      }

      updateData.providerId = data.providerId;
    }

    const finalProviderId =
      (updateData.providerId as string | undefined) ?? undefined;

    if (data.courseId !== undefined) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
        select: {
          id: true,
          providerId: true,
        },
      });

      if (!course) {
        throw new ApiError("Course not found", 404);
      }

      if (finalProviderId && course.providerId !== finalProviderId) {
        throw new ApiError("Selected course does not belong to the selected provider", 400);
      }

      updateData.courseId = data.courseId;
    }

    if (data.intake !== undefined) updateData.intake = data.intake;
    if (data.intakeYear !== undefined) updateData.intakeYear = data.intakeYear ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.applicationNo !== undefined) updateData.applicationNo = data.applicationNo ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt ?? null;
    if (data.offerDate !== undefined) updateData.offerDate = data.offerDate ?? null;

    if (updateData.providerId && !updateData.courseId) {
      const existing = await prisma.clientApplication.findUnique({
        where: { id },
        select: {
          courseId: true,
        },
      });

      if (!existing) {
        throw new ApiError("Application not found", 404);
      }

      const existingCourse = await prisma.course.findUnique({
        where: { id: existing.courseId },
        select: {
          providerId: true,
        },
      });

      if (!existingCourse) {
        throw new ApiError("Existing course not found", 404);
      }

      if (existingCourse.providerId !== updateData.providerId) {
        throw new ApiError(
          "Cannot change provider without selecting a course from that provider",
          400
        );
      }
    }

    const updatedApplication = await prisma.clientApplication.update({
      where: { id },
      data: updateData,
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

    await createAuditLog({
      actorUserId: session.user.id,
      action: "application.updated",
      entityType: "application",
      entityId: updatedApplication.id,
      message: `Application updated for ${updatedApplication.client.firstName} ${updatedApplication.client.lastName}`,
      metadata: {
        updatedFields: Object.keys(updateData),
        status: updatedApplication.status,
      },
    });

    return ok(updatedApplication);
  } catch (error) {
    console.error("Application PATCH error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}