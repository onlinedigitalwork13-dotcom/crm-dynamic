import { NextRequest, NextResponse } from "next/server";
import {
  createManualChecklistItem,
  generateChecklistForApplication,
  getChecklistByApplication,
} from "@/lib/application-checklist-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required." },
        { status: 400 }
      );
    }

    const result = await getChecklistByApplication(applicationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/application-checklists error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch application checklist.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "generate") {
      const applicationId = body.applicationId as string | undefined;
      const replaceExisting = Boolean(body.replaceExisting);

      if (!applicationId) {
        return NextResponse.json(
          { error: "applicationId is required." },
          { status: 400 }
        );
      }

      const checklist = await generateChecklistForApplication(applicationId, {
        replaceExisting,
      });

      return NextResponse.json({
        success: true,
        message: "Checklist generated successfully.",
        data: checklist,
      });
    }

    if (action === "create-manual-item") {
      const applicationId = body.applicationId as string | undefined;
      const title = body.title as string | undefined;

      if (!applicationId) {
        return NextResponse.json(
          { error: "applicationId is required." },
          { status: 400 }
        );
      }

      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: "title is required." },
          { status: 400 }
        );
      }

      const item = await createManualChecklistItem(applicationId, {
        title,
        description: body.description ?? null,
        category: body.category ?? null,
        isRequired:
          typeof body.isRequired === "boolean" ? body.isRequired : true,
        dueDate: body.dueDate ?? null,
        sortOrder:
          typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      });

      return NextResponse.json({
        success: true,
        message: "Manual checklist item created successfully.",
        data: item,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid action. Supported actions are: generate, create-manual-item.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/application-checklists error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process checklist request.",
      },
      { status: 500 }
    );
  }
}