import { NextRequest, NextResponse } from "next/server";
import { addChecklistDocument } from "@/lib/application-checklist-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const title = body.title as string | undefined;
    const fileName = body.fileName as string | undefined;
    const filePath = body.filePath as string | undefined;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "title is required." },
        { status: 400 }
      );
    }

    if (!fileName || !fileName.trim()) {
      return NextResponse.json(
        { error: "fileName is required." },
        { status: 400 }
      );
    }

    if (!filePath || !filePath.trim()) {
      return NextResponse.json(
        { error: "filePath is required." },
        { status: 400 }
      );
    }

    const document = await addChecklistDocument({
      checklistItemId: id,
      uploadedById: body.uploadedById ?? null,
      title,
      fileName,
      filePath,
      fileType: body.fileType ?? null,
      fileSize: typeof body.fileSize === "number" ? body.fileSize : null,
    });

    return NextResponse.json({
      success: true,
      message: "Checklist document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    console.error(
      "POST /api/application-checklists/[id]/documents error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload checklist document.",
      },
      { status: 500 }
    );
  }
}