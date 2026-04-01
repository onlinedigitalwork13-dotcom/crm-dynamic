import { NextRequest, NextResponse } from "next/server";
import {
  updateChecklistItem,
  deleteChecklistItem,
  verifyChecklistItem,
  markChecklistItemReceived,
  rejectChecklistItem,
  waiveChecklistItem,
  requestChecklistItem,
} from "@/lib/application-checklist-service";

type RouteContext = {
  params: Promise<{
    id: string;
    iteamId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { iteamId: itemId } = await params;
    const body = await request.json();

    let updated;

    if (body.action === "verify") {
      updated = await verifyChecklistItem(itemId, body.verifiedById);
    } else if (body.action === "request") {
      updated = await requestChecklistItem(itemId, body.remarks);
    } else if (body.action === "received") {
      updated = await markChecklistItemReceived(itemId, body.remarks);
    } else if (body.action === "reject") {
      updated = await rejectChecklistItem(itemId, body.remarks);
    } else if (body.action === "waive") {
      updated = await waiveChecklistItem(itemId, body.remarks);
    } else {
      updated = await updateChecklistItem(itemId, {
        title: body.title,
        description: body.description,
        category: body.category,
        isRequired: body.isRequired,
        status: body.status,
        remarks: body.remarks,
        dueDate: body.dueDate,
        sortOrder: body.sortOrder,
        verifiedById: body.verifiedById,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Checklist item updated successfully",
      item: updated,
    });
  } catch (error) {
    console.error("PATCH checklist item error:", error);

    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { iteamId: itemId } = await params;

    const result = await deleteChecklistItem(itemId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE checklist item error:", error);

    return NextResponse.json(
      { error: "Failed to delete checklist item" },
      { status: 500 }
    );
  }
}