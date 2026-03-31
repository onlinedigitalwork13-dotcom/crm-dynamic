import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id: workflowId } = await context.params;
    const body = await req.json();

    const stageIds = body.stageIds;

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return NextResponse.json(
        { error: "stageIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const normalizedStageIds = stageIds.filter(
      (value: unknown): value is string =>
        typeof value === "string" && value.trim().length > 0
    );

    if (normalizedStageIds.length !== stageIds.length) {
      return NextResponse.json(
        { error: "stageIds must contain only valid stage IDs" },
        { status: 400 }
      );
    }

    const uniqueStageIds = new Set(normalizedStageIds);

    if (uniqueStageIds.size !== normalizedStageIds.length) {
      return NextResponse.json(
        { error: "stageIds contains duplicate values" },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const existingStages = await prisma.workflowStage.findMany({
      where: { workflowId },
      select: { id: true },
      orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
    });

    if (existingStages.length === 0) {
      return NextResponse.json(
        { error: "This workflow has no stages to reorder" },
        { status: 400 }
      );
    }

    if (existingStages.length !== normalizedStageIds.length) {
      return NextResponse.json(
        {
          error:
            "stageIds must include every stage in the workflow for a full reorder",
        },
        { status: 400 }
      );
    }

    const existingStageIds = new Set(existingStages.map((stage) => stage.id));

    for (const stageId of normalizedStageIds) {
      if (!existingStageIds.has(stageId)) {
        return NextResponse.json(
          {
            error:
              "One or more provided stage IDs do not belong to this workflow",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < normalizedStageIds.length; index++) {
        await tx.workflowStage.update({
          where: { id: normalizedStageIds[index] },
          data: {
            orderSequence: 1000 + index,
          },
        });
      }

      for (let index = 0; index < normalizedStageIds.length; index++) {
        await tx.workflowStage.update({
          where: { id: normalizedStageIds[index] },
          data: {
            orderSequence: index + 1,
          },
        });
      }
    });

    const reorderedStages = await prisma.workflowStage.findMany({
      where: { workflowId },
      orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      message: "Workflow stages reordered successfully",
      stages: reorderedStages,
    });
  } catch (error) {
    console.error("Reorder workflow stages error:", error);

    return NextResponse.json(
      { error: "Failed to reorder workflow stages" },
      { status: 500 }
    );
  }
}