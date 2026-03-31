import { NextRequest, NextResponse } from "next/server";
import {
  getChecklistByApplication,
  createManualChecklistItem,
  generateChecklistForApplication,
  reorderChecklistItems,
} from "@/lib/application-checklist-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const checklist = await getChecklistByApplication(id);

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("GET checklist error:", error);

    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "generate") {
      const items = await generateChecklistForApplication(id, {
        replaceExisting: Boolean(body.replaceExisting),
      });

      return NextResponse.json({
        success: true,
        message: "Checklist generated successfully",
        items,
      });
    }

    if (body.action === "reorder") {
      const result = await reorderChecklistItems(id, body.items || []);

      return NextResponse.json({
        success: true,
        message: "Checklist reordered successfully",
        ...result,
      });
    }

    const item = await createManualChecklistItem(id, {
      title: body.title,
      description: body.description,
      category: body.category,
      isRequired: body.isRequired,
      dueDate: body.dueDate,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Checklist item created successfully",
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST checklist error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checklist item",
      },
      { status: 500 }
    );
  }
}