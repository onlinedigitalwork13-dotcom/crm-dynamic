import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    ruleId: string;
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

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { ruleId } = await params;
    const body = await request.json();

    const existingRule = await prisma.workflowAutomationRule.findUnique({
      where: { id: ruleId },
      select: {
        id: true,
        workflowId: true,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const data: {
      name?: string;
      description?: string | null;
      fromStageId?: string | null;
      toStageId?: string | null;
      eventType?: string;
      targetType?: "client" | "assigned_user" | "branch_admin" | "staff";
      channel?: "email" | "in_app" | "both";
      provider?: "resend" | "suprsend" | "system";
      templateKey?: string;
      delayMinutes?: number;
      isActive?: boolean;
    } = {};

    if ("name" in body) {
      const name = normalizeString(body.name);
      if (!name) {
        return NextResponse.json(
          { error: "Rule name is required" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if ("description" in body) {
      data.description = normalizeNullableString(body.description);
    }

    if ("fromStageId" in body) {
      const fromStageId = normalizeNullableString(body.fromStageId);

      if (fromStageId) {
        const fromStage = await prisma.workflowStage.findFirst({
          where: {
            id: fromStageId,
            workflowId: existingRule.workflowId,
          },
          select: { id: true },
        });

        if (!fromStage) {
          return NextResponse.json(
            { error: "Selected from stage does not belong to this workflow" },
            { status: 400 }
          );
        }
      }

      data.fromStageId = fromStageId;
    }

    if ("toStageId" in body) {
      const toStageId = normalizeNullableString(body.toStageId);

      if (toStageId) {
        const toStage = await prisma.workflowStage.findFirst({
          where: {
            id: toStageId,
            workflowId: existingRule.workflowId,
          },
          select: { id: true },
        });

        if (!toStage) {
          return NextResponse.json(
            { error: "Selected to stage does not belong to this workflow" },
            { status: 400 }
          );
        }
      }

      data.toStageId = toStageId;
    }

    if ("eventType" in body) {
      const eventType = normalizeString(body.eventType);
      if (!eventType) {
        return NextResponse.json(
          { error: "Event type is required" },
          { status: 400 }
        );
      }
      data.eventType = eventType;
    }

    if ("targetType" in body) {
      const targetType = normalizeString(body.targetType);
      if (!targetType) {
        return NextResponse.json(
          { error: "Target type is required" },
          { status: 400 }
        );
      }
      data.targetType = targetType as
        | "client"
        | "assigned_user"
        | "branch_admin"
        | "staff";
    }

    if ("channel" in body) {
      const channel = normalizeString(body.channel);
      if (!channel) {
        return NextResponse.json(
          { error: "Channel is required" },
          { status: 400 }
        );
      }
      data.channel = channel as "email" | "in_app" | "both";
    }

    if ("provider" in body) {
      const provider = normalizeString(body.provider);
      if (!provider) {
        return NextResponse.json(
          { error: "Provider is required" },
          { status: 400 }
        );
      }
      data.provider = provider as "resend" | "suprsend" | "system";
    }

    if ("templateKey" in body) {
      const templateKey = normalizeString(body.templateKey);
      if (!templateKey) {
        return NextResponse.json(
          { error: "Template key is required" },
          { status: 400 }
        );
      }
      data.templateKey = templateKey;
    }

    if ("delayMinutes" in body) {
      data.delayMinutes = normalizeNumber(body.delayMinutes, 0);
    }

    if ("isActive" in body) {
      data.isActive = normalizeBoolean(body.isActive, true);
    }

    const rule = await prisma.workflowAutomationRule.update({
      where: { id: ruleId },
      data,
      include: {
        fromStage: {
          select: {
            id: true,
            stageName: true,
            orderSequence: true,
            isFinal: true,
          },
        },
        toStage: {
          select: {
            id: true,
            stageName: true,
            orderSequence: true,
            isFinal: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Automation rule updated successfully",
      rule,
    });
  } catch (error) {
    console.error("PATCH workflow rule error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update automation rule",
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

    const { ruleId } = await params;

    const existingRule = await prisma.workflowAutomationRule.findUnique({
      where: { id: ruleId },
      select: { id: true },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.workflowAutomationRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({
      success: true,
      message: "Automation rule deleted successfully",
    });
  } catch (error) {
    console.error("DELETE workflow rule error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete automation rule",
      },
      { status: 500 }
    );
  }
}