import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

function redirectWithMessage(
  request: NextRequest,
  path: string,
  params: Record<string, string>
) {
  const url = new URL(path, request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url);
}

function generateReferralCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SAG-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function getSubmissionMetaObject(
  value: Prisma.JsonValue | null
): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Prisma.InputJsonObject;
}

function getLeadNotesWithPrefillData(params: {
  existingNotes: string | null;
  submissionMeta: Prisma.JsonValue | null;
}) {
  const { existingNotes, submissionMeta } = params;

  const meta =
    submissionMeta && typeof submissionMeta === "object" && !Array.isArray(submissionMeta)
      ? (submissionMeta as Record<string, unknown>)
      : null;

  const applicationInterest =
    meta &&
    meta.applicationInterest &&
    typeof meta.applicationInterest === "object" &&
    !Array.isArray(meta.applicationInterest)
      ? (meta.applicationInterest as Record<string, unknown>)
      : {};

  const subagent =
    meta &&
    meta.subagent &&
    typeof meta.subagent === "object" &&
    !Array.isArray(meta.subagent)
      ? (meta.subagent as Record<string, unknown>)
      : {};

  const payload = JSON.stringify({
    applicationInterest,
    subagent,
  });

  if (!existingNotes?.trim()) {
    return payload;
  }

  return `${existingNotes.trim()}\n\n[PREFILL_DATA]\n${payload}`;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      if (wantsJson(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return redirectWithMessage(request, "/login", {
        error: "Please log in to continue",
      });
    }

    const { id } = await params;
    const formData = await request.formData();

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isActive: true,
        branchId: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!currentUser || !currentUser.isActive) {
      if (wantsJson(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return redirectWithMessage(request, "/login", {
        error: "Unauthorized",
      });
    }

    const currentUserRole = normalizeRole(currentUser.role?.name);
    const isAdmin =
      currentUserRole === "admin" || currentUserRole === "super_admin";

    const submission = await prisma.intakeFormSubmission.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            isActive: true,
          },
        },
        client: {
          select: {
            id: true,
          },
        },
        intakeFormRequest: {
          select: {
            id: true,
            title: true,
            token: true,
            createdById: true,
            assignedToId: true,
            branchId: true,
          },
        },
        lead: {
          select: {
            id: true,
            assignedToId: true,
            notes: true,
          },
        },
      },
    });

    if (!submission) {
      if (wantsJson(request)) {
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }

      return redirectWithMessage(request, "/intake-submissions", {
        error: "Submission not found",
      });
    }

    if (!isAdmin) {
      if (!currentUser.branchId) {
        if (wantsJson(request)) {
          return NextResponse.json(
            { error: "Your account is not linked to a branch" },
            { status: 403 }
          );
        }

        return redirectWithMessage(
          request,
          `/intake-submissions/${submission.id}/convert`,
          { error: "Your account is not linked to a branch" }
        );
      }

      if (!submission.branchId || submission.branchId !== currentUser.branchId) {
        if (wantsJson(request)) {
          return NextResponse.json(
            { error: "You can only convert submissions from your branch" },
            { status: 403 }
          );
        }

        return redirectWithMessage(
          request,
          `/intake-submissions/${submission.id}/convert`,
          { error: "You can only convert submissions from your branch" }
        );
      }
    }

    if (submission.clientId || submission.client) {
      if (wantsJson(request)) {
        return NextResponse.json(
          { error: "This submission has already been converted" },
          { status: 400 }
        );
      }

      return redirectWithMessage(
        request,
        `/clients/${submission.clientId || submission.client?.id}`,
        { success: "Submission already converted" }
      );
    }

    const firstName = readString(formData, "firstName") ?? submission.firstName;
    const lastName = readString(formData, "lastName") ?? submission.lastName;
    const email = readString(formData, "email") ?? submission.email;
    const phone = readString(formData, "phone") ?? submission.phone;
    const passport =
      readString(formData, "passport") ??
      readString(formData, "passportNumber") ??
      submission.passportNumber;
    const notes = readString(formData, "notes") ?? submission.notes;

    const requestedBranchId =
      readString(formData, "branchId") ?? submission.branchId ?? null;

    const sourceId =
      readString(formData, "sourceId") ?? readString(formData, "leadSourceId");
    const workflowId = readString(formData, "workflowId");
    const currentStageId =
      readString(formData, "currentStageId") ??
      readString(formData, "workflowStageId");

    const selectedSubagentId = readString(formData, "subagentId");
    const newSubagentName = readString(formData, "newSubagentName");
    const newSubagentEmail = readString(formData, "newSubagentEmail");
    const newSubagentPhone = readString(formData, "newSubagentPhone");
    const newSubagentAgency = readString(formData, "newSubagentAgency");

    if (!firstName || !lastName || !phone) {
      const error = "First name, last name, and phone are required";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (!requestedBranchId) {
      const error = "Branch is required for conversion";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (!isAdmin && requestedBranchId !== currentUser.branchId) {
      const error = "You can only convert clients into your own branch";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 403 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (currentStageId && !workflowId) {
      const error = "A workflow stage requires a workflow";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (selectedSubagentId && newSubagentName) {
      const error =
        "Please either select an existing subagent or create a new one, not both";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (
      !selectedSubagentId &&
      !newSubagentName &&
      (newSubagentEmail || newSubagentPhone || newSubagentAgency)
    ) {
      const error = "Subagent name is required when creating a new subagent";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    const [branch, leadSource, workflow, workflowStage, selectedSubagent] =
      await Promise.all([
        prisma.branch.findUnique({
          where: { id: requestedBranchId },
          select: {
            id: true,
            isActive: true,
          },
        }),
        sourceId
          ? prisma.leadSource.findUnique({
              where: { id: sourceId },
              select: {
                id: true,
                isActive: true,
              },
            })
          : Promise.resolve(null),
        workflowId
          ? prisma.workflow.findUnique({
              where: { id: workflowId },
              select: {
                id: true,
                isActive: true,
              },
            })
          : Promise.resolve(null),
        currentStageId
          ? prisma.workflowStage.findUnique({
              where: { id: currentStageId },
              select: {
                id: true,
                workflowId: true,
              },
            })
          : Promise.resolve(null),
        selectedSubagentId
          ? prisma.subagent.findUnique({
              where: { id: selectedSubagentId },
              select: {
                id: true,
                isActive: true,
              },
            })
          : Promise.resolve(null),
      ]);

    if (!branch || !branch.isActive) {
      const error = "Selected branch was not found or is inactive";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (sourceId && (!leadSource || !leadSource.isActive)) {
      const error = "Selected lead source was not found or is inactive";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (workflowId && (!workflow || !workflow.isActive)) {
      const error = "Selected workflow was not found or is inactive";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (workflowStage && workflowId && workflowStage.workflowId !== workflowId) {
      const error = "Selected stage does not belong to the selected workflow";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    if (selectedSubagentId && (!selectedSubagent || !selectedSubagent.isActive)) {
      const error = "Selected subagent was not found or is inactive";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    const submissionMetaObject = getSubmissionMetaObject(submission.submissionMeta);

    const profileData: Prisma.InputJsonObject = {
      convertedFromSubmissionId: submission.id,
      convertedAtIso: new Date().toISOString(),
      intakeFormTitle: submission.intakeFormRequest?.title ?? null,
      intakeFormToken: submission.intakeFormRequest?.token ?? null,
      country: submission.country ?? null,
      city: submission.city ?? null,
      address: submission.address ?? null,
      nationality: submission.nationality ?? null,
      dateOfBirth: submission.dateOfBirth
        ? submission.dateOfBirth.toISOString()
        : null,
      passportNumber: submission.passportNumber ?? null,
      originalNotes: submission.notes ?? null,
      internalNotes: submission.internalNotes ?? null,
      answers:
        submission.answers && typeof submission.answers === "object"
          ? (submission.answers as Prisma.InputJsonObject)
          : {},
      submissionMeta: submissionMetaObject,
      newSubagentAgency: newSubagentAgency ?? null,
    };

    const result = await prisma.$transaction(async (tx) => {
      let resolvedSubagentId: string | null = selectedSubagentId;

      if (!resolvedSubagentId && newSubagentName) {
        const createdSubagent = await tx.subagent.create({
          data: {
            name: newSubagentName,
            email: newSubagentEmail,
            phone: newSubagentPhone,
            referralCode: generateReferralCode(),
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        resolvedSubagentId = createdSubagent.id;
      }

      const resolvedAssignedToId =
        submission.assignedToId ??
        submission.lead?.assignedToId ??
        submission.intakeFormRequest?.assignedToId ??
        null;

      const resolvedCreatedById =
        submission.intakeFormRequest?.createdById ?? currentUser.id;

      const client = await tx.client.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passport,
          notes: undefined,
          profileData,
          branchId: requestedBranchId,
          sourceId: sourceId ?? undefined,
          workflowId: workflowId ?? undefined,
          currentStageId: currentStageId ?? undefined,
          subagentId: resolvedSubagentId ?? undefined,
          originalIntakeSubmissionId: submission.id,
          createdById: resolvedCreatedById,
          assignedToId: resolvedAssignedToId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      await tx.intakeFormSubmission.update({
        where: { id: submission.id },
        data: {
          clientId: client.id,
          status: "converted",
          convertedAt: new Date(),
          reviewedAt: submission.reviewedAt ?? new Date(),
          reviewedById: submission.reviewedById ?? currentUser.id,
        },
      });

      if (submission.lead) {
        await tx.lead.update({
          where: { id: submission.lead.id },
          data: {
            clientId: client.id,
            assignedToId: resolvedAssignedToId,
            status: "converted",
            lastActivityAt: new Date(),
            agentId: resolvedSubagentId ?? undefined,
            notes: getLeadNotesWithPrefillData({
              existingNotes: submission.lead.notes ?? submission.notes ?? notes,
              submissionMeta: submission.submissionMeta,
            }),
            activities: {
              create: {
                actorUserId: currentUser.id,
                action: "lead_converted_to_client",
                details: {
                  clientId: client.id,
                  intakeSubmissionId: submission.id,
                  subagentId: resolvedSubagentId,
                  newSubagentAgency,
                } as Prisma.InputJsonValue,
              },
            },
          },
        });
      }

      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          type: "intake_submission_converted",
          message: `Client created from intake submission ${submission.id}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: currentUser.id,
          action: "intake_submission.convert",
          entityType: "IntakeFormSubmission",
          entityId: submission.id,
          message: `Converted intake submission to client ${client.id}`,
          metadata: {
            clientId: client.id,
            branchId: requestedBranchId,
            sourceId,
            workflowId,
            currentStageId,
            subagentId: resolvedSubagentId,
            createdById: resolvedCreatedById,
            assignedToId: resolvedAssignedToId,
            createdNewSubagent: Boolean(!selectedSubagentId && newSubagentName),
            newSubagentAgency,
          } as Prisma.InputJsonValue,
        },
      });

      return client;
    });

    if (wantsJson(request)) {
      return NextResponse.json({
        success: true,
        message: "Submission converted successfully",
        clientId: result.id,
      });
    }

    return NextResponse.redirect(new URL(`/clients/${result.id}`, request.url));
  } catch (error) {
    console.error("POST /api/intake-submissions/[id]/convert error:", error);

    if (wantsJson(request)) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to convert submission",
        },
        { status: 500 }
      );
    }

    return redirectWithMessage(request, "/intake-submissions", {
      error: "Failed to convert submission",
    });
  }
}