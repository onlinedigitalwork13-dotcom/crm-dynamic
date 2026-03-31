import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { createApplicationSchema } from "@/lib/validators/application";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";

export async function GET() {
  try {
    const session = await requireApiAuth();

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const where = isAdmin(roleName)
      ? {}
      : hasBranchScopedAccess(roleName, branchId)
      ? {
          client: {
            branchId,
          },
        }
      : (() => {
          throw new ApiError("Forbidden", 403);
        })();

    const applications = await prisma.clientApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return ok(applications);
  } catch (error) {
    console.error("Applications GET error:", error);

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
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid application data", 400, parsed.error.flatten());
    }

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: {
        id: true,
        branchId: true,
      },
    });

    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    if (!isAdmin(roleName)) {
      if (!branchId || client.branchId !== branchId) {
        throw new ApiError("Forbidden", 403);
      }
    }

    const provider = await prisma.provider.findUnique({
      where: { id: parsed.data.providerId },
      select: { id: true },
    });

    if (!provider) {
      throw new ApiError("Provider not found", 404);
    }

    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
      select: {
        id: true,
        providerId: true,
      },
    });

    if (!course) {
      throw new ApiError("Course not found", 404);
    }

    if (course.providerId !== parsed.data.providerId) {
      throw new ApiError("Selected course does not belong to the selected provider", 400);
    }

    const application = await prisma.clientApplication.create({
      data: {
        clientId: parsed.data.clientId,
        providerId: parsed.data.providerId,
        courseId: parsed.data.courseId,
        intake: parsed.data.intake,
        intakeYear: parsed.data.intakeYear ?? null,
        status: parsed.data.status ?? "applied",
        applicationNo: parsed.data.applicationNo ?? null,
        notes: parsed.data.notes ?? null,
        appliedAt: parsed.data.appliedAt ?? null,
        offerDate: parsed.data.offerDate ?? null,
      },
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
      action: "application.created",
      entityType: "application",
      entityId: application.id,
      message: `Application created for ${application.client.firstName} ${application.client.lastName}`,
      metadata: {
        clientId: application.clientId,
        providerId: application.providerId,
        courseId: application.courseId,
        intake: application.intake,
        intakeYear: application.intakeYear,
        status: application.status,
      },
    });

    return ok(application, 201);
  } catch (error) {
    console.error("Applications POST error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}