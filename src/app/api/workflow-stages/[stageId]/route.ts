import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    stageId: string;
  }>;
};

function normalizeStageName(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 100) return null;

  return trimmed;
}

function normalizeOrderSequence(value: unknown) {
  const num = Number(value);

  if (!Number.isInteger(num) || num < 1) {
    return null;
  }

  return num;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
   const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { stageId } = await context.params;

    const stage = await prisma.workflowStage.findUnique({
      where: { id: stageId },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            currentClients: true,
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Workflow stage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error("Fetch workflow stage error:", error);

    return NextResponse.json(
      { error: "Failed to fetch workflow stage" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { stageId } = await context.params;
    const body = await req.json();

    const existingStage = await prisma.workflowStage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        workflowId: true,
        stageName: true,
        orderSequence: true,
        isFinal: true,
      },
    });

    if (!existingStage) {
      return NextResponse.json(
        { error: "Workflow stage not found" },
        { status: 404 }
      );
    }

    const stageName =
      body.stageName === undefined
        ? existingStage.stageName
        : normalizeStageName(body.stageName);

    const orderSequence =
      body.orderSequence === undefined
        ? existingStage.orderSequence
        : normalizeOrderSequence(body.orderSequence);

    const isFinal =
      body.isFinal === undefined
        ? existingStage.isFinal
        : body.isFinal === true;

    if (!stageName) {
      return NextResponse.json(
        { error: "Stage name is required and must be under 100 characters" },
        { status: 400 }
      );
    }

    if (!orderSequence) {
      return NextResponse.json(
        { error: "Order sequence must be a positive whole number" },
        { status: 400 }
      );
    }

    const duplicateStageName = await prisma.workflowStage.findFirst({
      where: {
        workflowId: existingStage.workflowId,
        id: { not: stageId },
        stageName: {
          equals: stageName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateStageName) {
      return NextResponse.json(
        { error: "A stage with this name already exists in this workflow" },
        { status: 409 }
      );
    }

    const duplicateOrderSequence = await prisma.workflowStage.findFirst({
      where: {
        workflowId: existingStage.workflowId,
        id: { not: stageId },
        orderSequence,
      },
      select: { id: true },
    });

    if (duplicateOrderSequence) {
      return NextResponse.json(
        { error: "This stage order is already being used in this workflow" },
        { status: 409 }
      );
    }

    const updatedStage = await prisma.$transaction(async (tx) => {
      if (isFinal) {
        await tx.workflowStage.updateMany({
          where: {
            workflowId: existingStage.workflowId,
            id: { not: stageId },
            isFinal: true,
          },
          data: {
            isFinal: false,
          },
        });
      }

      return tx.workflowStage.update({
        where: { id: stageId },
        data: {
          stageName,
          orderSequence,
          isFinal,
        },
      });
    });

    return NextResponse.json(updatedStage);
  } catch (error) {
    console.error("Update workflow stage error:", error);

    return NextResponse.json(
      { error: "Failed to update workflow stage" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
  const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { stageId } = await context.params;

    const existingStage = await prisma.workflowStage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        workflowId: true,
        isFinal: true,
        _count: {
          select: {
            currentClients: true,
          },
        },
      },
    });

    if (!existingStage) {
      return NextResponse.json(
        { error: "Workflow stage not found" },
        { status: 404 }
      );
    }

    if (existingStage._count.currentClients > 0) {
      return NextResponse.json(
        {
          error:
            "This stage cannot be deleted because it is currently assigned to one or more clients",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.workflowStage.delete({
        where: { id: stageId },
      });

      const remainingStages = await tx.workflowStage.findMany({
        where: { workflowId: existingStage.workflowId },
        orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
        },
      });

      for (let index = 0; index < remainingStages.length; index++) {
        await tx.workflowStage.update({
          where: { id: remainingStages[index].id },
          data: { orderSequence: index + 1 },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Workflow stage deleted successfully",
    });
  } catch (error) {
    console.error("Delete workflow stage error:", error);

    return NextResponse.json(
      { error: "Failed to delete workflow stage" },
      { status: 500 }
    );
  }
}