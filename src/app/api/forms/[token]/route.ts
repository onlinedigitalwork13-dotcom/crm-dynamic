import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

type IntakeFormSettings = {
  source?: string;
  channel?: "general" | "subagent" | "event" | "partner";
  agentMode?: "none" | "optional" | "required";
  defaultAgentId?: string | null;

  // backward compatibility only
  referralType?: string;
  agentId?: string | null;
};

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "on" ||
    normalized === "yes"
  );
}

function getSettingsObject(value: Prisma.JsonValue | null): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;

  const channel =
    settings.channel === "subagent" ||
    settings.channel === "event" ||
    settings.channel === "partner"
      ? settings.channel
      : "general";

  return {
    source:
      typeof settings.source === "string"
        ? settings.source.trim()
        : undefined,
    channel,
    agentMode:
      settings.agentMode === "optional" || settings.agentMode === "required"
        ? settings.agentMode
        : "none",
    defaultAgentId:
      typeof settings.defaultAgentId === "string" &&
      settings.defaultAgentId.trim().length > 0
        ? settings.defaultAgentId.trim()
        : null,

    // backward compatibility only
    referralType:
      typeof settings.referralType === "string"
        ? settings.referralType.trim()
        : undefined,
    agentId:
      typeof settings.agentId === "string" && settings.agentId.trim().length > 0
        ? settings.agentId.trim()
        : null,
  };
}

function buildSource(settings: IntakeFormSettings) {
  const explicitSource = settings.source?.trim();
  if (explicitSource) return explicitSource;

  if (settings.channel === "subagent") return "subagent";
  if (settings.channel === "event") return "event";
  if (settings.channel === "partner") return "partner";

  // fallback only for old data
  if (settings.referralType === "agent") return "subagent";

  return "intake_form";
}

async function resolveDefaultSubagentId(settings: IntakeFormSettings) {
  const candidateIds = [
    settings.defaultAgentId?.trim(),
    settings.agentId?.trim(), // backward compatibility only
  ].filter((value): value is string => Boolean(value));

  for (const id of candidateIds) {
    const subagent = await prisma.subagent.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (subagent?.isActive) {
      return subagent.id;
    }
  }

  return null;
}

async function findExistingClient(params: {
  email: string | null;
  phone: string | null;
}) {
  const { email, phone } = params;

  const orFilters: Prisma.ClientWhereInput[] = [];

  if (email) {
    orFilters.push({
      email: {
        equals: email,
        mode: "insensitive",
      },
    });
  }

  if (phone) {
    orFilters.push({
      phone: {
        equals: phone,
      },
    });
  }

  if (orFilters.length === 0) {
    return null;
  }

  return prisma.client.findFirst({
    where: {
      OR: orFilters,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      branchId: true,
    },
  });
}

// ================= GET =================
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { token } = await params;

    const form = await prisma.intakeFormRequest.findUnique({
      where: { token },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("GET /api/forms/[token] error:", error);

    return NextResponse.json(
      { error: "Failed to load form" },
      { status: 500 }
    );
  }
}

// ================= POST =================
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { token } = await params;

    const intakeForm = await prisma.intakeFormRequest.findUnique({
      where: { token },
      select: {
        id: true,
        branchId: true,
        title: true,
        status: true,
        isActive: true,
        expiresAt: true,
        settings: true,
      },
    });

    if (!intakeForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!intakeForm.isActive || intakeForm.status !== "active") {
      return NextResponse.json(
        { error: "This form is not currently active" },
        { status: 403 }
      );
    }

    if (intakeForm.expiresAt && new Date(intakeForm.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This form has expired" },
        { status: 410 }
      );
    }

    const formData = await request.formData();

    // Core student identity
    const firstName = normalizeString(formData.get("firstName"));
    const lastName = normalizeString(formData.get("lastName"));
    const phone = normalizeString(formData.get("phone"));
    const email = normalizeString(formData.get("email"));

    // Student profile details
    const country = normalizeString(formData.get("country"));
    const city = normalizeString(formData.get("city"));
    const address = normalizeString(formData.get("address"));
    const nationality = normalizeString(formData.get("nationality"));
    const passportNumber = normalizeString(formData.get("passportNumber"));
    const dateOfBirth = normalizeDate(formData.get("dateOfBirth"));
    const notes = normalizeString(formData.get("notes"));

    // Application intent details
    const destinationCountry = normalizeString(
      formData.get("destinationCountry")
    );
    const providerName = normalizeString(formData.get("providerName"));
    const courseName = normalizeString(formData.get("courseName"));
    const subjectArea = normalizeString(formData.get("subjectArea"));
    const intake = normalizeString(formData.get("intake"));
    const studyLevel = normalizeString(formData.get("studyLevel"));
    const preferredCampus = normalizeString(formData.get("preferredCampus"));

    // Subagent / agency details entered in shared agent form
    const subagentName = normalizeString(formData.get("subagentName"));
    const agencyName = normalizeString(formData.get("agencyName"));
    const subagentEmail = normalizeString(formData.get("subagentEmail"));
    const subagentPhone = normalizeString(formData.get("subagentPhone"));
    const subagentReference = normalizeString(formData.get("subagentReference"));
    const isExistingStudent = normalizeBoolean(formData.get("isExistingStudent"));

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    const settings = getSettingsObject(
      intakeForm.settings as Prisma.JsonValue | null
    );

    const defaultSubagentId = await resolveDefaultSubagentId(settings);
    const source = buildSource(settings);

    const existingClient = await findExistingClient({
      email,
      phone,
    });

    const submissionMeta: Prisma.InputJsonObject = {
      submittedFromToken: token,
      submittedAtIso: new Date().toISOString(),
      formTitle: intakeForm.title,

      source,
      channel: settings.channel || "general",
      agentMode: settings.agentMode || "none",
      defaultAgentId: settings.defaultAgentId || null,

      // backward compatibility snapshot only
      legacyReferralType: settings.referralType || null,
      legacyAgentId: settings.agentId || null,

      defaultSubagentId,

      subagent: {
        name: subagentName,
        agencyName,
        email: subagentEmail,
        phone: subagentPhone,
        reference: subagentReference,
      },

      applicationInterest: {
        destinationCountry,
        providerName,
        courseName,
        subjectArea,
        intake,
        studyLevel,
        preferredCampus,
      },

      duplicateCheck: {
        existingClientFound: Boolean(existingClient),
        existingClientId: existingClient?.id ?? null,
        matchedBy: {
          email: Boolean(email && existingClient?.email),
          phone: Boolean(phone && existingClient?.phone),
          passportNumber: false,
        },
      },

      isExistingStudent,
    };

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.intakeFormSubmission.create({
        data: {
          intakeFormRequestId: intakeForm.id,
          branchId: intakeForm.branchId,
          clientId: existingClient?.id ?? null,
          firstName,
          lastName,
          phone,
          email,
          country,
          city,
          address,
          nationality,
          dateOfBirth,
          passportNumber,
          notes,
          submissionMeta,
          status: existingClient ? "under_review" : "new",
        },
        select: {
          id: true,
          clientId: true,
        },
      });

      const lead = await tx.lead.create({
        data: {
          intakeSubmissionId: submission.id,
          clientId: existingClient?.id ?? null,
          branchId: existingClient?.branchId ?? intakeForm.branchId,

          // only default subagent binding if configured internally
          agentId: defaultSubagentId,

          firstName,
          lastName,
          email,
          phone,
          passportNumber,
          country,
          source,
          status: existingClient ? "under_review" : "new_lead",
          notes: [
            notes,
            destinationCountry ? `Destination: ${destinationCountry}` : null,
            providerName ? `Provider: ${providerName}` : null,
            courseName ? `Course: ${courseName}` : null,
            subjectArea ? `Subject: ${subjectArea}` : null,
            intake ? `Intake: ${intake}` : null,
            studyLevel ? `Study Level: ${studyLevel}` : null,
            preferredCampus ? `Campus: ${preferredCampus}` : null,
            subagentName ? `Subagent: ${subagentName}` : null,
            agencyName ? `Agency: ${agencyName}` : null,
            existingClient
              ? `Matched existing client: ${[
                  existingClient.firstName,
                  existingClient.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
          lastActivityAt: now,
          activities: {
            create: {
              action: "lead_created_from_intake_form",
              details: {
                token,
                intakeFormId: intakeForm.id,
                source,
                channel: settings.channel || "general",
                existingClientId: existingClient?.id ?? null,
                defaultSubagentId,
                subagentName,
                agencyName,
                courseName,
                intake,
              } as Prisma.InputJsonObject,
            },
          },
        },
        select: {
          id: true,
          clientId: true,
        },
      });

      await tx.intakeFormRequest.update({
        where: { id: intakeForm.id },
        data: {
          lastSubmittedAt: now,
        },
      });

      return {
        submission,
        lead,
        existingClient,
      };
    });

    const users = await prisma.user.findMany({
      where: {
        branchId: result.existingClient?.branchId ?? intakeForm.branchId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const notificationMessage = result.existingClient
      ? `${firstName} ${lastName} submitted a new application inquiry for an existing student profile`
      : `${firstName} ${lastName} submitted a new inquiry`;

    await Promise.all(
      users.map((user: { id: string }) =>
        createNotification({
          userId: user.id,
          title: "New Lead Received",
          message: notificationMessage,
          type: "lead_created",
          link: "/leads",
        })
      )
    );

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
      leadId: result.lead.id,
      matchedExistingClient: Boolean(result.existingClient),
      existingClientId: result.existingClient?.id ?? null,
      message: result.existingClient
        ? "Submission received and linked to the existing student profile."
        : "Submission received successfully.",
    });
  } catch (error) {
    console.error("POST /api/forms/[token] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to submit form",
      },
      { status: 500 }
    );
  }
}