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

function normalizeText(value?: string | null) {
  return (value || "").trim();
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
    submissionMeta &&
    typeof submissionMeta === "object" &&
    !Array.isArray(submissionMeta)
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

  const parts: string[] = [];

  if (
    applicationInterest.destinationCountry ||
    applicationInterest.providerName ||
    applicationInterest.courseName ||
    applicationInterest.subjectArea ||
    applicationInterest.intake ||
    applicationInterest.studyLevel ||
    applicationInterest.preferredCampus
  ) {
    parts.push(
      [
        applicationInterest.destinationCountry
          ? `Destination: ${String(applicationInterest.destinationCountry)}`
          : null,
        applicationInterest.providerName
          ? `Provider: ${String(applicationInterest.providerName)}`
          : null,
        applicationInterest.courseName
          ? `Course: ${String(applicationInterest.courseName)}`
          : null,
        applicationInterest.subjectArea
          ? `Subject: ${String(applicationInterest.subjectArea)}`
          : null,
        applicationInterest.intake
          ? `Intake: ${String(applicationInterest.intake)}`
          : null,
        applicationInterest.studyLevel
          ? `Study Level: ${String(applicationInterest.studyLevel)}`
          : null,
        applicationInterest.preferredCampus
          ? `Campus: ${String(applicationInterest.preferredCampus)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  if (
    subagent.name ||
    subagent.agencyName ||
    subagent.email ||
    subagent.phone ||
    subagent.reference
  ) {
    parts.push(
      [
        subagent.name ? `Subagent: ${String(subagent.name)}` : null,
        subagent.agencyName ? `Agency: ${String(subagent.agencyName)}` : null,
        subagent.email ? `Subagent Email: ${String(subagent.email)}` : null,
        subagent.phone ? `Subagent Phone: ${String(subagent.phone)}` : null,
        subagent.reference ? `Reference: ${String(subagent.reference)}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  const payload = JSON.stringify({
    applicationInterest,
    subagent,
  });

  return [existingNotes?.trim() || null, parts.length ? parts.join("\n\n") : null, `[PREFILL_DATA]\n${payload}`]
    .filter(Boolean)
    .join("\n\n");
}

type SubmissionMetaSubagent = {
  name?: string | null;
  agencyName?: string | null;
  email?: string | null;
  phone?: string | null;
  reference?: string | null;
};

function extractSubmissionMetaSubagent(
  value: Prisma.JsonValue | null
): SubmissionMetaSubagent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const subagentValue = record.subagent;

  if (
    !subagentValue ||
    typeof subagentValue !== "object" ||
    Array.isArray(subagentValue)
  ) {
    return null;
  }

  const subagent = subagentValue as Record<string, unknown>;

  return {
    name:
      typeof subagent.name === "string" ? normalizeText(subagent.name) : null,
    agencyName:
      typeof subagent.agencyName === "string"
        ? normalizeText(subagent.agencyName)
        : null,
    email:
      typeof subagent.email === "string" ? normalizeText(subagent.email) : null,
    phone:
      typeof subagent.phone === "string" ? normalizeText(subagent.phone) : null,
    reference:
      typeof subagent.reference === "string"
        ? normalizeText(subagent.reference)
        : null,
  };
}

async function resolveSubagentFromSubmissionMeta(
  tx: Prisma.TransactionClient,
  submissionMeta: Prisma.JsonValue | null
) {
  const metaSubagent = extractSubmissionMetaSubagent(submissionMeta);

  if (!metaSubagent) {
    return {
      matchedSubagentId: null as string | null,
      matchedBy: null as string | null,
      metaSubagent: null as SubmissionMetaSubagent | null,
    };
  }

  const reference = normalizeText(metaSubagent.reference);
  const email = normalizeText(metaSubagent.email);
  const phone = normalizeText(metaSubagent.phone);
  const name = normalizeText(metaSubagent.name);

  if (reference) {
    const byReference = await tx.subagent.findFirst({
      where: {
        isActive: true,
        referralCode: {
          equals: reference,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (byReference) {
      return {
        matchedSubagentId: byReference.id,
        matchedBy: "referralCode",
        metaSubagent,
      };
    }
  }

  if (email) {
    const byEmail = await tx.subagent.findFirst({
      where: {
        isActive: true,
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (byEmail) {
      return {
        matchedSubagentId: byEmail.id,
        matchedBy: "email",
        metaSubagent,
      };
    }
  }

  if (phone) {
    const byPhone = await tx.subagent.findFirst({
      where: {
        isActive: true,
        phone,
      },
      select: { id: true },
    });

    if (byPhone) {
      return {
        matchedSubagentId: byPhone.id,
        matchedBy: "phone",
        metaSubagent,
      };
    }
  }

  if (name) {
    const byName = await tx.subagent.findFirst({
      where: {
        isActive: true,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (byName) {
      return {
        matchedSubagentId: byName.id,
        matchedBy: "name",
        metaSubagent,
      };
    }
  }

  return {
    matchedSubagentId: null,
    matchedBy: null,
    metaSubagent,
  };
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

    const existingClientId = readString(formData, "existingClientId");
    const useExistingClient = readString(formData, "useExistingClient") === "true";
    const openApplicationAfterConvert =
      readString(formData, "openApplicationAfterConvert") === "true";

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

    if (useExistingClient && !existingClientId) {
      const error = "Please select an existing client to use";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return redirectWithMessage(
        request,
        `/intake-submissions/${submission.id}/convert`,
        { error }
      );
    }

    const [
      branch,
      leadSource,
      workflow,
      workflowStage,
      selectedSubagent,
      selectedExistingClient,
    ] = await Promise.all([
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
      existingClientId
        ? prisma.client.findUnique({
            where: { id: existingClientId },
            select: {
              id: true,
              branchId: true,
              createdById: true,
              assignedToId: true,
              profileData: true,
              subagentId: true,
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

    if (useExistingClient && !selectedExistingClient) {
      const error = "Selected existing client was not found";

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
      useExistingClient &&
      selectedExistingClient &&
      !isAdmin &&
      selectedExistingClient.branchId &&
      selectedExistingClient.branchId !== currentUser.branchId
    ) {
      const error = "You can only attach to an existing client in your branch";

      if (wantsJson(request)) {
        return NextResponse.json({ error }, { status: 403 });
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
      openApplicationAfterConvert,
    };

    const txResult = await prisma.$transaction(
      async (tx) => {
        let resolvedSubagentId: string | null = selectedSubagentId;
        let autoMatchedSubagentBy: string | null = null;
        let submissionMetaSubagent: SubmissionMetaSubagent | null = null;

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

        if (!resolvedSubagentId) {
          const resolvedFromMeta = await resolveSubagentFromSubmissionMeta(
            tx,
            submission.submissionMeta
          );

          resolvedSubagentId = resolvedFromMeta.matchedSubagentId;
          autoMatchedSubagentBy = resolvedFromMeta.matchedBy;
          submissionMetaSubagent = resolvedFromMeta.metaSubagent;
        }

        const resolvedAssignedToId =
          submission.assignedToId ??
          submission.lead?.assignedToId ??
          submission.intakeFormRequest?.assignedToId ??
          selectedExistingClient?.assignedToId ??
          null;

        const resolvedCreatedById =
          submission.intakeFormRequest?.createdById ??
          selectedExistingClient?.createdById ??
          currentUser.id;

        const enrichedProfileData: Prisma.InputJsonObject = {
          ...profileData,
          resolvedSubagentId,
          autoMatchedSubagentBy,
          resolvedFromSubmissionMeta: Boolean(
            !selectedSubagentId && !newSubagentName && resolvedSubagentId
          ),
          submissionMetaSubagent:
            submissionMetaSubagent &&
            Object.keys(submissionMetaSubagent).length > 0
              ? (submissionMetaSubagent as unknown as Prisma.InputJsonValue)
              : null,
        };

        let clientId: string;
        let clientForReturn: {
          id: string;
          firstName: string | null;
          lastName: string | null;
        };

        if (useExistingClient && selectedExistingClient) {
          const existingProfileData =
            selectedExistingClient.profileData &&
            typeof selectedExistingClient.profileData === "object" &&
            !Array.isArray(selectedExistingClient.profileData)
              ? (selectedExistingClient.profileData as Prisma.InputJsonObject)
              : {};

          const updatedClient = await tx.client.update({
            where: {
              id: selectedExistingClient.id,
            },
            data: {
              firstName,
              lastName,
              email,
              phone,
              passport,
              branchId: requestedBranchId,
              sourceId: sourceId ?? undefined,
              workflowId: workflowId ?? undefined,
              currentStageId: currentStageId ?? undefined,
              subagentId:
                resolvedSubagentId ??
                selectedExistingClient.subagentId ??
                undefined,
              assignedToId: resolvedAssignedToId,
              profileData: {
                ...existingProfileData,
                latestConversion: enrichedProfileData,
                lastLinkedIntakeSubmissionId: submission.id,
                lastLinkedIntakeAtIso: new Date().toISOString(),
              } as Prisma.InputJsonObject,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          });

          clientId = updatedClient.id;
          clientForReturn = updatedClient;
        } else {
          const createdClient = await tx.client.create({
            data: {
              firstName,
              lastName,
              email,
              phone,
              passport,
              notes: undefined,
              profileData: enrichedProfileData,
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

          clientId = createdClient.id;
          clientForReturn = createdClient;
        }

        await tx.intakeFormSubmission.update({
          where: { id: submission.id },
          data: {
            clientId,
            status: "converted",
            convertedAt: new Date(),
            reviewedAt: submission.reviewedAt ?? new Date(),
            reviewedById: submission.reviewedById ?? currentUser.id,
            subagentId: resolvedSubagentId ?? undefined,
          },
        });

        if (submission.lead) {
          const leadUpdateData: Prisma.LeadUpdateInput = {
            status: "converted",
            lastActivityAt: new Date(),
            notes: getLeadNotesWithPrefillData({
              existingNotes: submission.lead.notes ?? submission.notes ?? notes,
              submissionMeta: submission.submissionMeta,
            }),
            client: {
              connect: { id: clientId },
            },
            activities: {
              create: {
                actorUserId: currentUser.id,
                action: useExistingClient
                  ? "lead_linked_to_existing_client"
                  : "lead_converted_to_client",
                details: {
                  clientId,
                  intakeSubmissionId: submission.id,
                  subagentId: resolvedSubagentId,
                  autoMatchedSubagentBy,
                  newSubagentAgency,
                  usedExistingClient: useExistingClient,
                  openApplicationAfterConvert,
                } as Prisma.InputJsonValue,
              },
            },
          };

          if (resolvedAssignedToId) {
            leadUpdateData.assignedTo = {
              connect: { id: resolvedAssignedToId },
            };
            leadUpdateData.assignedAt = new Date();
          } else {
            leadUpdateData.assignedTo = {
              disconnect: true,
            };
            leadUpdateData.assignedAt = null;
          }

          if (resolvedSubagentId) {
            leadUpdateData.agent = {
              connect: { id: resolvedSubagentId },
            };
          } else {
            leadUpdateData.agent = {
              disconnect: true,
            };
          }

          await tx.lead.update({
            where: { id: submission.lead.id },
            data: leadUpdateData,
          });
        }

        return {
          client: clientForReturn,
          clientId,
          resolvedSubagentId,
          autoMatchedSubagentBy,
          resolvedCreatedById,
          resolvedAssignedToId,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    await Promise.all([
      prisma.clientActivity.create({
        data: {
          clientId: txResult.clientId,
          type: useExistingClient
            ? "intake_submission_linked_to_existing_client"
            : "intake_submission_converted",
          message: useExistingClient
            ? `Intake submission ${submission.id} linked to existing client ${txResult.clientId}`
            : `Client created from intake submission ${submission.id}`,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: currentUser.id,
          action: useExistingClient
            ? "intake_submission.link_existing_client"
            : "intake_submission.convert",
          entityType: "IntakeFormSubmission",
          entityId: submission.id,
          message: useExistingClient
            ? `Linked intake submission to existing client ${txResult.clientId}`
            : `Converted intake submission to client ${txResult.clientId}`,
          metadata: {
            clientId: txResult.clientId,
            branchId: requestedBranchId,
            sourceId,
            workflowId,
            currentStageId,
            subagentId: txResult.resolvedSubagentId,
            createdById: txResult.resolvedCreatedById,
            assignedToId: txResult.resolvedAssignedToId,
            createdNewSubagent: Boolean(!selectedSubagentId && newSubagentName),
            autoMatchedSubagentBy: txResult.autoMatchedSubagentBy,
            newSubagentAgency,
            usedExistingClient: useExistingClient,
            existingClientId: selectedExistingClient?.id ?? null,
            openApplicationAfterConvert,
          } as Prisma.InputJsonValue,
        },
      }),
    ]);

    if (wantsJson(request)) {
      return NextResponse.json({
        success: true,
        message: useExistingClient
          ? "Submission linked to existing client successfully"
          : "Submission converted successfully",
        clientId: txResult.client.id,
        redirectTo: openApplicationAfterConvert
          ? `/clients/${txResult.client.id}/applications/new`
          : `/clients/${txResult.client.id}`,
      });
    }

    const redirectPath = openApplicationAfterConvert
      ? `/clients/${txResult.client.id}/applications/new`
      : `/clients/${txResult.client.id}`;

    return NextResponse.redirect(new URL(redirectPath, request.url));
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