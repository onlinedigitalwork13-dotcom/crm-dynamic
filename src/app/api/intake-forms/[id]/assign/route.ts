import { NextRequest, NextResponse } from "next/server";
import { assignIntakeFormRequest } from "@/lib/intake-form-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const assignedToId = body.assignedToId as string | undefined;
    const actingUserId = body.actingUserId as string | undefined;

    if (!assignedToId) {
      return NextResponse.json(
        { error: "assignedToId is required." },
        { status: 400 }
      );
    }

    if (!actingUserId) {
      return NextResponse.json(
        { error: "actingUserId is required." },
        { status: 400 }
      );
    }

    const data = await assignIntakeFormRequest({
      requestId: id,
      assignedToId,
      actingUserId,
    });

    return NextResponse.json({
      success: true,
      message: "Intake form request assigned successfully.",
      data,
    });
  } catch (error) {
    console.error("POST /api/intake-forms/[id]/assign error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign intake form request.",
      },
      { status: 500 }
    );
  }
}