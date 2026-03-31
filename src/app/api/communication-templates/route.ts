import { NextRequest, NextResponse } from "next/server";
import {
  createCommunicationTemplate,
  getCommunicationTemplates,
} from "@/lib/communication-template-service";
import { requireApiRole } from "@/lib/require-api-role";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableString(value: unknown) {
  const stringValue = normalizeString(value);
  return stringValue ? stringValue : null;
}

function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET() {
  try {
    const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const templates = await getCommunicationTemplates();

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("GET communication templates error:", error);

    return NextResponse.json(
      { error: "Failed to fetch communication templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json();

    const name = normalizeString(body?.name);
    const key = normalizeString(body?.key);
    const description = normalizeNullableString(body?.description);
    const channel = normalizeString(body?.channel) as "email" | "in_app" | "both";
    const subject = normalizeNullableString(body?.subject);
    const bodyContent = normalizeString(body?.body);
    const isActive = normalizeBoolean(body?.isActive, true);

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: "Template key is required" },
        { status: 400 }
      );
    }

    if (!channel || !["email", "in_app", "both"].includes(channel)) {
      return NextResponse.json(
        { error: "Valid channel is required" },
        { status: 400 }
      );
    }

    if (!bodyContent) {
      return NextResponse.json(
        { error: "Template body is required" },
        { status: 400 }
      );
    }

    const template = await createCommunicationTemplate({
      name,
      key,
      description,
      channel,
      subject,
      body: bodyContent,
      isActive,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Communication template created successfully",
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST communication template error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create communication template",
      },
      { status: 500 }
    );
  }
}