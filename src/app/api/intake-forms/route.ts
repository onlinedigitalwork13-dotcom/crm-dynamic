import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type IntakeFormSettings = {
  referralType: "standard" | "agent";
  agentId: string | null;
  source: string;
};

function slugifyToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const branch = await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const createdBy = await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (!branch || !createdBy) {
      return NextResponse.json(
        { error: "Branch or user not found for form creation" },
        { status: 400 }
      );
    }

    const title = normalizeOptionalString(body.title);
    const tokenInput = normalizeOptionalString(body.token);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const baseToken = slugifyToken(tokenInput || title);
    const token =
      baseToken.length > 0
        ? baseToken
        : crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const existing = await prisma.intakeFormRequest.findUnique({
      where: { token },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Token already exists. Please use another token." },
        { status: 409 }
      );
    }

    const settings = normalizeSettings(body.settings);

    if (settings.referralType === "agent" && settings.agentId) {
      const agent = await prisma.subagent.findUnique({
        where: { id: settings.agentId },
        select: { id: true, isActive: true },
      });

      if (!agent || !agent.isActive) {
        return NextResponse.json(
          { error: "Selected agent is invalid or inactive" },
          { status: 400 }
        );
      }
    }

    const publicUrl = buildPublicUrl(token);

    const created = await prisma.intakeFormRequest.create({
      data: {
        branchId: branch.id,
        createdById: createdBy.id,
        title,
        description: normalizeOptionalString(body.description),
        token,
        status: body.status === "active" ? "active" : "draft",
        isActive: Boolean(body.isActive),
        publicUrl,
        qrCodeValue: publicUrl,
        submitButtonText:
          normalizeOptionalString(body.submitButtonText) || "Submit",
        successMessage:
          normalizeOptionalString(body.successMessage) ||
          "Thank you. Your form has been submitted successfully.",
        formSchema: Array.isArray(body.formSchema) ? body.formSchema : [],
        settings: settings as Prisma.InputJsonValue,
        notes: normalizeOptionalString(body.notes),
        sharedAt: body.status === "active" ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        token: true,
        publicUrl: true,
        status: true,
        isActive: true,
        settings: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/intake-forms error:", error);

    return NextResponse.json(
      { error: "Failed to create intake form" },
      { status: 500 }
    );
  }
}