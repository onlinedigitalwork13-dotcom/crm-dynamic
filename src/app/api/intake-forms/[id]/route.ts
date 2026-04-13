import { NextRequest, NextResponse } from "next/server";
import { Prisma, IntakeFormRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type IntakeFormSettings = {
  referralType: "standard" | "agent";
  agentId: string | null;
  source: string;
  channel: "general" | "subagent" | "event" | "partner";
  agentMode: "none" | "optional" | "required";
  defaultAgentId: string | null;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeChannel(value: unknown): IntakeFormSettings["channel"] {
  if (value === "subagent") return "subagent";
  if (value === "event") return "event";
  if (value === "partner") return "partner";
  return "general";
}

function normalizeAgentMode(value: unknown): IntakeFormSettings["agentMode"] {
  if (value === "required") return "required";
  if (value === "optional") return "optional";
  return "none";
}

function normalizeStatus(value: unknown): IntakeFormRequestStatus {
  if (value === "active") return IntakeFormRequestStatus.active;
  if (value === "inactive") return IntakeFormRequestStatus.inactive;
  if (value === "archived") return IntakeFormRequestStatus.archived;
  return IntakeFormRequestStatus.draft;
}

function buildPublicUrl(token: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";
  return base ? `${base}/forms/${token}` : `/forms/${token}`;
}

function normalizeSettings(value: unknown): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      referralType: "standard",
      agentId: null,
      source: "intake_form",
      channel: "general",
      agentMode: "none",
      defaultAgentId: null,
    };
  }

  const obj = value as Record<string, unknown>;

  const referralType =
    obj.referralType === "agent" ? "agent" : "standard";

  const channel =
    typeof obj.channel === "string"
      ? normalizeChannel(obj.channel)
      : referralType === "agent"
      ? "subagent"
      : "general";

  const agentMode =
    typeof obj.agentMode === "string"
      ? normalizeAgentMode(obj.agentMode)
      : referralType === "agent"
      ? "required"
      : "none";

  const defaultAgentId =
    typeof obj.defaultAgentId === "string" &&
    obj.defaultAgentId.trim().length > 0
      ? obj.defaultAgentId.trim()
      : null;

  const legacyAgentId =
    typeof obj.agentId === "string" && obj.agentId.trim().length > 0
      ? obj.agentId.trim()
      : null;

  const resolvedDefaultAgentId = defaultAgentId ?? legacyAgentId;

  const source =
    typeof obj.source === "string" && obj.source.trim().length > 0
      ? obj.source.trim()
      : channel === "subagent"
      ? "subagent"
      : channel === "event"
      ? "event"
      : channel === "partner"
      ? "partner"
      : referralType === "agent"
      ? "agent"
      : "intake_form";

  return {
    referralType: channel === "subagent" ? "agent" : referralType,
    agentId: null,
    source,
    channel,
    agentMode,
    defaultAgentId: resolvedDefaultAgentId,
  };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAuth();

    const { id } = await context.params;
    const body = await req.json();

    const {
      title,
      description,
      submitButtonText,
      successMessage,
      formSchema,
      isActive,
      status,
      settings,
    } = body ?? {};

    const existing = await prisma.intakeFormRequest.findUnique({
      where: { id },
      select: {
        id: true,
        token: true,
        sharedAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Form not found." },
        { status: 404 }
      );
    }

    const normalizedTitle = normalizeOptionalString(title) ?? "";
    const normalizedDescription = normalizeOptionalString(description);
    const normalizedSubmitButtonText =
      normalizeOptionalString(submitButtonText) ?? "Submit";
    const normalizedSuccessMessage =
      normalizeOptionalString(successMessage) ??
      "Form submitted successfully.";

    const normalizedSettings = normalizeSettings(settings);
    const requestedStatus = normalizeStatus(status);

    if (!normalizedTitle) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (
      normalizedSettings.agentMode === "required" &&
      !normalizedSettings.defaultAgentId
    ) {
      return NextResponse.json(
        {
          error:
            "A default internal agent is required when agent mode is set to required.",
        },
        { status: 400 }
      );
    }

    if (normalizedSettings.defaultAgentId) {
      const agent = await prisma.subagent.findUnique({
        where: { id: normalizedSettings.defaultAgentId },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!agent || !agent.isActive) {
        return NextResponse.json(
          { error: "Selected default internal agent is invalid or inactive." },
          { status: 400 }
        );
      }
    }

    let resolvedStatus: IntakeFormRequestStatus = requestedStatus;
    let resolvedIsActive =
      typeof isActive === "boolean" ? isActive : undefined;

    if (resolvedStatus === IntakeFormRequestStatus.draft) {
      resolvedIsActive = false;
    } else if (resolvedStatus === IntakeFormRequestStatus.inactive) {
      resolvedIsActive = false;
    } else if (resolvedStatus === IntakeFormRequestStatus.archived) {
      resolvedIsActive = false;
    } else if (resolvedStatus === IntakeFormRequestStatus.active) {
      resolvedIsActive = true;
    }

    const publicUrl = buildPublicUrl(existing.token);

    const updated = await prisma.intakeFormRequest.update({
      where: { id },
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        submitButtonText: normalizedSubmitButtonText,
        successMessage: normalizedSuccessMessage,
        publicUrl,
        qrCodeValue: publicUrl,
        isActive: resolvedIsActive,
        status: resolvedStatus,
        formSchema: Array.isArray(formSchema)
          ? (formSchema as Prisma.InputJsonValue)
          : [],
        settings: normalizedSettings as Prisma.InputJsonValue,
        sharedAt:
          resolvedStatus === IntakeFormRequestStatus.active
            ? existing.sharedAt ?? new Date()
            : null,
      },
      select: {
        id: true,
        title: true,
        token: true,
        publicUrl: true,
        qrCodeValue: true,
        updatedAt: true,
        isActive: true,
        status: true,
        settings: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/intake-forms/[id] failed:", error);

    return NextResponse.json(
      { error: "Failed to update intake form." },
      { status: 500 }
    );
  }
}