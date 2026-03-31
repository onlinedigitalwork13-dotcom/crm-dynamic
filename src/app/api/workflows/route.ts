import { NextRequest, NextResponse } from "next/server";
import { getWorkflows, createWorkflow } from "@/lib/workflow-service";
import { requireApiRole } from "@/lib/require-api-role";

function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const guard = await requireApiRole(["admin", "super_admin", "counsellor"]);

    if (!guard.ok) {
      return guard.response;
    }

    const workflows = await getWorkflows();

    return NextResponse.json({
      success: true,
      count: Array.isArray(workflows) ? workflows.length : 0,
      workflows,
    });
  } catch (error) {
    console.error("GET workflows error:", error);

    return NextResponse.json(
      { error: "Failed to fetch workflows" },
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
    const description = normalizeString(body?.description);
    const isActive = normalizeBoolean(body?.isActive, true);

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 }
      );
    }

    const workflow = await createWorkflow({
      name,
      description: description || undefined,
      isActive,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workflow created successfully",
        workflow,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST workflow error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create workflow",
      },
      { status: 500 }
    );
  }
}