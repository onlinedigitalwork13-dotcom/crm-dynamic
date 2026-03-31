import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { addChecklistDocument } from "@/lib/application-checklist-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function createStoredFileName(originalName: string) {
  const safeName = sanitizeFileName(originalName || "document");
  const timestamp = Date.now();
  return `${timestamp}-${safeName}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();

    const titleValue = formData.get("title");
    const uploadedByIdValue = formData.get("uploadedById");
    const fileValue = formData.get("file");

    const title =
      typeof titleValue === "string" && titleValue.trim()
        ? titleValue.trim()
        : null;

    const uploadedById =
      typeof uploadedByIdValue === "string" && uploadedByIdValue.trim()
        ? uploadedByIdValue.trim()
        : null;

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { error: "A valid file is required." },
        { status: 400 }
      );
    }

    if (fileValue.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    const storedFileName = createStoredFileName(fileValue.name);
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "application-checklists",
      id
    );

    await mkdir(uploadDir, { recursive: true });

    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());
    const absoluteFilePath = path.join(uploadDir, storedFileName);

    await writeFile(absoluteFilePath, fileBuffer);

    const publicFilePath = `/uploads/application-checklists/${id}/${storedFileName}`;

    const document = await addChecklistDocument({
      checklistItemId: id,
      uploadedById,
      title: title || fileValue.name,
      fileName: storedFileName,
      filePath: publicFilePath,
      fileType: fileValue.type || null,
      fileSize: fileValue.size,
    });

    return NextResponse.json({
      success: true,
      message: "Checklist document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    console.error(
      "POST /api/application-checklists/[id]/upload error:",
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