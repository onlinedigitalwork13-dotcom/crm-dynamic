import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    id: string;
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

    const { id } = await context.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const stages = await prisma.workflowStage.findMany({
      where: { workflowId: id },
      orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Fetch workflow stages error:", error);

    return NextResponse.json(
      { error: "Failed to fetch workflow stages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;
    const body = await req.json();

    const stageName = normalizeStageName(body.stageName);
    const orderSequence = normalizeOrderSequence(body.orderSequence);
    const isFinal = body.isFinal === true;

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

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const existingStageName = await prisma.workflowStage.findFirst({
      where: {
        workflowId: id,
        stageName: {
          equals: stageName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingStageName) {
      return NextResponse.json(
        { error: "A stage with this name already exists in this workflow" },
        { status: 409 }
      );
    }

    const existingOrderSequence = await prisma.workflowStage.findFirst({
      where: {
        workflowId: id,
        orderSequence,
      },
      select: { id: true },
    });

    if (existingOrderSequence) {
      return NextResponse.json(
        { error: "This stage order is already being used in this workflow" },
        { status: 409 }
      );
    }

    const createdStage = await prisma.$transaction(async (tx) => {
      if (isFinal) {
        await tx.workflowStage.updateMany({
          where: {
            workflowId: id,
            isFinal: true,
          },
          data: {
            isFinal: false,
          },
        });
      }

      return tx.workflowStage.create({
        data: {
          workflowId: id,
          stageName,
          orderSequence,
          isFinal,
        },
      });
    });

    return NextResponse.json(createdStage, { status: 201 });
  } catch (error) {
    console.error("Create workflow stage error:", error);

    return NextResponse.json(
      { error: "Failed to create workflow stage" },
      { status: 500 }
    );
  }
}