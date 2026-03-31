import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
} from "@/lib/workflow-service";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const workflow = await getWorkflowById(id);

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error) {
    console.error("GET workflow by id error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch workflow",
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

    const name = normalizeString(body?.name);
    const description = normalizeString(body?.description);
    const isActive = normalizeBoolean(body?.isActive, true);

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 }
      );
    }

    const workflow = await updateWorkflow(id, {
      name,
      description: description || undefined,
      isActive,
    });

    return NextResponse.json({
      success: true,
      message: "Workflow updated successfully",
      workflow,
    });
  } catch (error) {
    console.error("PATCH workflow error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update workflow",
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

    await deleteWorkflow(id);

    return NextResponse.json({
      success: true,
      message: "Workflow deleted successfully",
    });
  } catch (error) {
    console.error("DELETE workflow error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete workflow",
      },
      { status: 500 }
    );
  }
}