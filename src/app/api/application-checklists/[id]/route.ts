import { NextRequest, NextResponse } from "next/server";
import {
  deleteChecklistItem,
  getChecklistItemById,
  rejectChecklistItem,
  requestChecklistItem,
  updateChecklistItem,
  verifyChecklistItem,
  waiveChecklistItem,
  markChecklistItemReceived,
} from "@/lib/application-checklist-service";
import { ApplicationChecklistStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const item = await getChecklistItemById(id);

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/application-checklists/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch checklist item.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const action = body.action as string | undefined;

    if (action === "verify") {
      const item = await verifyChecklistItem(id, body.verifiedById ?? null);

      return NextResponse.json({
        success: true,
        message: "Checklist item verified successfully.",
        data: item,
      });
    }

    if (action === "request") {
      const item = await requestChecklistItem(id, body.remarks ?? null);

      return NextResponse.json({
        success: true,
        message: "Checklist item marked as requested.",
        data: item,
      });
    }

    if (action === "received") {
      const item = await markChecklistItemReceived(id, body.remarks ?? null);

      return NextResponse.json({
        success: true,
        message: "Checklist item marked as received.",
        data: item,
      });
    }

    if (action === "reject") {
      const item = await rejectChecklistItem(id, body.remarks ?? null);

      return NextResponse.json({
        success: true,
        message: "Checklist item rejected.",
        data: item,
      });
    }

    if (action === "waive") {
      const item = await waiveChecklistItem(id, body.remarks ?? null);

      return NextResponse.json({
        success: true,
        message: "Checklist item waived.",
        data: item,
      });
    }

    const allowedStatuses = Object.values(ApplicationChecklistStatus);
    const status =
      typeof body.status === "string" &&
      allowedStatuses.includes(body.status as ApplicationChecklistStatus)
        ? (body.status as ApplicationChecklistStatus)
        : undefined;

    const updatedItem = await updateChecklistItem(id, {
      title: body.title,
      description: body.description,
      category: body.category,
      isRequired:
        typeof body.isRequired === "boolean" ? body.isRequired : undefined,
      status,
      remarks: body.remarks,
      dueDate: body.dueDate,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      verifiedById: body.verifiedById,
    });

    return NextResponse.json({
      success: true,
      message: "Checklist item updated successfully.",
      data: updatedItem,
    });
  } catch (error) {
    console.error("PATCH /api/application-checklists/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update checklist item.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await deleteChecklistItem(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/application-checklists/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete checklist item.",
      },
      { status: 500 }
    );
  }
}