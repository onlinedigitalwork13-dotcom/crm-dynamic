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
  referralType?: string;
  agentId?: string;
  source?: string;
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

function getSettingsObject(value: Prisma.JsonValue | null): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;

  return {
    referralType:
      typeof settings.referralType === "string"
        ? settings.referralType.trim()
        : undefined,
    agentId:
      typeof settings.agentId === "string" ? settings.agentId.trim() : undefined,
    source:
      typeof settings.source === "string" ? settings.source.trim() : undefined,
  };
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

    const firstName = normalizeString(formData.get("firstName"));
    const lastName = normalizeString(formData.get("lastName"));
    const phone = normalizeString(formData.get("phone"));
    const email = normalizeString(formData.get("email"));
    const country = normalizeString(formData.get("country"));
    const notes = normalizeString(formData.get("notes"));
    const city = normalizeString(formData.get("city"));
    const address = normalizeString(formData.get("address"));
    const nationality = normalizeString(formData.get("nationality"));
    const passportNumber = normalizeString(formData.get("passportNumber"));
    const dateOfBirth = normalizeDate(formData.get("dateOfBirth"));

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    const settings = getSettingsObject(
      intakeForm.settings as Prisma.JsonValue | null
    );

    let validatedAgentId: string | null = null;

    if (settings.referralType === "agent" && settings.agentId) {
      const agent = await prisma.subagent.findUnique({
        where: { id: settings.agentId },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (agent?.isActive) {
        validatedAgentId = agent.id;
      }
    }

    const source =
      settings.referralType === "agent" && validatedAgentId
        ? settings.source?.trim() || "agent"
        : settings.source?.trim() || "intake_form";

    const submissionMeta: Prisma.InputJsonObject = {
      submittedFromToken: token,
      submittedAtIso: new Date().toISOString(),
      formTitle: intakeForm.title,
      referralType: settings.referralType || null,
      agentId: validatedAgentId,
      source,
    };

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.intakeFormSubmission.create({
        data: {
          intakeFormRequestId: intakeForm.id,
          branchId: intakeForm.branchId,
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
          status: "new",
        },
      });

      const lead = await tx.lead.create({
        data: {
          intakeSubmissionId: submission.id,
          branchId: intakeForm.branchId,
          agentId: validatedAgentId,
          firstName,
          lastName,
          email,
          phone,
          passportNumber,
          country,
          source,
          status: "new_lead",
          notes,
          lastActivityAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      await tx.intakeFormRequest.update({
        where: { id: intakeForm.id },
        data: {
          lastSubmittedAt: new Date(),
        },
      });

      return {
        submission,
        lead,
      };
    });

    const users = await prisma.user.findMany({
      where: {
        branchId: intakeForm.branchId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      users.map((user: { id: string }) =>
        createNotification({
          userId: user.id,
          title: "New Lead Received",
          message: `${firstName} ${lastName} submitted a new inquiry`,
          type: "lead_created",
          link: "/leads",
        })
      )
    );

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
      leadId: result.lead.id,
    });
  } catch (error) {
    console.error("POST /api/forms/[token] error:", error);

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}