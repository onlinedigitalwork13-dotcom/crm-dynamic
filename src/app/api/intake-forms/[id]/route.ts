import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type IntakeFormSettings = {
  referralType: "standard" | "agent";
  agentId: string | null;
  source: string;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSettings(value: unknown): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      referralType: "standard",
      agentId: null,
      source: "intake_form",
    };
  }

  const obj = value as Record<string, unknown>;

  const referralType =
    obj.referralType === "agent" ? "agent" : "standard";

  const agentId =
    typeof obj.agentId === "string" && obj.agentId.trim().length > 0
      ? obj.agentId.trim()
      : null;

  const source =
    typeof obj.source === "string" && obj.source.trim().length > 0
      ? obj.source.trim()
      : referralType === "agent"
      ? "agent"
      : "intake_form";

  return {
    referralType,
    agentId,
    source,
  };
}

function buildPublicUrl(token: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";
  return base ? `${base}/forms/${token}` : `/forms/${token}`;
}

function normalizeStatus(value: unknown) {
  if (value === "active") return "active";
  if (value === "inactive") return "inactive";
  if (value === "archived") return "archived";
  return "draft";
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
    const normalizedStatus = normalizeStatus(status);
    const normalizedSettings = normalizeSettings(settings);

    if (!normalizedTitle) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (
      normalizedSettings.referralType === "agent" &&
      normalizedSettings.agentId
    ) {
      const agent = await prisma.subagent.findUnique({
        where: { id: normalizedSettings.agentId },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!agent || !agent.isActive) {
        return NextResponse.json(
          { error: "Selected agent is invalid or inactive." },
          { status: 400 }
        );
      }
    }

    const publicUrl = buildPublicUrl(existing.token);
    const shouldBeActive = typeof isActive === "boolean" ? isActive : undefined;

    const updated = await prisma.intakeFormRequest.update({
      where: { id },
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        submitButtonText: normalizedSubmitButtonText,
        successMessage: normalizedSuccessMessage,
        publicUrl,
        qrCodeValue: publicUrl,
        isActive: shouldBeActive,
        status: normalizedStatus,
        formSchema: Array.isArray(formSchema)
          ? (formSchema as Prisma.InputJsonValue)
          : [],
        settings: normalizedSettings as Prisma.InputJsonValue,
        sharedAt:
          normalizedStatus === "active"
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