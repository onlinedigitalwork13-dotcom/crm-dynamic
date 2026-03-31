import { NextRequest, NextResponse } from "next/server";
import {
  deleteCommunicationTemplate,
  getCommunicationTemplateById,
  updateCommunicationTemplate,
} from "@/lib/communication-template-service";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const template = await getCommunicationTemplateById(id);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("GET communication template error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch communication template",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const body = await request.json();

    const data: {
      name?: string;
      key?: string;
      description?: string | null;
      channel?: "email" | "in_app" | "both";
      subject?: string | null;
      body?: string;
      isActive?: boolean;
    } = {};

    if ("name" in body) {
      const name = normalizeString(body.name);
      if (!name) {
        return NextResponse.json(
          { error: "Template name is required" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if ("key" in body) {
      const key = normalizeString(body.key);
      if (!key) {
        return NextResponse.json(
          { error: "Template key is required" },
          { status: 400 }
        );
      }
      data.key = key;
    }

    if ("description" in body) {
      data.description = normalizeNullableString(body.description);
    }

    if ("channel" in body) {
      const channel = normalizeString(body.channel);
      if (!channel || !["email", "in_app", "both"].includes(channel)) {
        return NextResponse.json(
          { error: "Valid channel is required" },
          { status: 400 }
        );
      }
      data.channel = channel as "email" | "in_app" | "both";
    }

    if ("subject" in body) {
      data.subject = normalizeNullableString(body.subject);
    }

    if ("body" in body) {
      const bodyContent = normalizeString(body.body);
      if (!bodyContent) {
        return NextResponse.json(
          { error: "Template body is required" },
          { status: 400 }
        );
      }
      data.body = bodyContent;
    }

    if ("isActive" in body) {
      data.isActive = normalizeBoolean(body.isActive, true);
    }

    const template = await updateCommunicationTemplate(id, data);

    return NextResponse.json({
      success: true,
      message: "Communication template updated successfully",
      template,
    });
  } catch (error) {
    console.error("PATCH communication template error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update communication template",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    await deleteCommunicationTemplate(id);

    return NextResponse.json({
      success: true,
      message: "Communication template deleted successfully",
    });
  } catch (error) {
    console.error("DELETE communication template error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete communication template",
      },
      { status: 500 }
    );
  }
}