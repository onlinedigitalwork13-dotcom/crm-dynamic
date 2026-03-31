import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id: workflowId } = await params;

    const rules = await prisma.workflowAutomationRule.findMany({
      where: {
        workflowId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
      rules,
    });
  } catch (error) {
    console.error("GET workflow rules error:", error);

    return NextResponse.json(
      { error: "Failed to fetch workflow rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id: workflowId } = await params;
    const body = await request.json();

    const name = normalizeString(body?.name);
    const description = normalizeNullableString(body?.description);
    const fromStageId = normalizeNullableString(body?.fromStageId);
    const toStageId = normalizeNullableString(body?.toStageId);
    const eventType = normalizeString(body?.eventType);
    const targetType = normalizeString(body?.targetType);
    const channel = normalizeString(body?.channel);
    const provider = normalizeString(body?.provider);
    const templateKey = normalizeString(body?.templateKey);
    const delayMinutes = normalizeNumber(body?.delayMinutes, 0);
    const isActive = normalizeBoolean(body?.isActive, true);

    if (!name) {
      return NextResponse.json({ error: "Rule name is required" }, { status: 400 });
    }

    if (!eventType) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 });
    }

    if (!targetType) {
      return NextResponse.json({ error: "Target type is required" }, { status: 400 });
    }

    if (!channel) {
      return NextResponse.json({ error: "Channel is required" }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    if (!templateKey) {
      return NextResponse.json({ error: "Template key is required" }, { status: 400 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (fromStageId) {
      const fromStage = await prisma.workflowStage.findFirst({
        where: {
          id: fromStageId,
          workflowId,
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

    if (toStageId) {
      const toStage = await prisma.workflowStage.findFirst({
        where: {
          id: toStageId,
          workflowId,
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

    const rule = await prisma.workflowAutomationRule.create({
      data: {
        workflowId,
        name,
        description,
        fromStageId,
        toStageId,
        eventType,
        targetType: targetType as
          | "client"
          | "assigned_user"
          | "branch_admin"
          | "staff",
        channel: channel as "email" | "in_app" | "both",
        provider: provider as "resend" | "suprsend" | "system",
        templateKey,
        delayMinutes,
        isActive,
      },
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

    return NextResponse.json(
      {
        success: true,
        message: "Automation rule created successfully",
        rule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST workflow rule error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create automation rule",
      },
      { status: 500 }
    );
  }
}