import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { unlink } from "fs/promises";
import {
  deleteChecklistDocument,
  getChecklistDocumentById,
} from "@/lib/application-checklist-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    documentsId: string;
  }>;
};

function toAbsolutePublicPath(filePath: string) {
  const normalized = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return path.join(process.cwd(), "public", normalized);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { documentsId: documentId } = await context.params;

    const document = await getChecklistDocumentById(documentId);

    const result = await deleteChecklistDocument(documentId);

    const filePath = document.filePath;

    if (filePath && filePath.startsWith("/uploads/")) {
      const absolutePath = toAbsolutePublicPath(filePath);

      try {
        await unlink(absolutePath);
      } catch (fileError) {
        console.warn(
          "Checklist document DB record deleted, but physical file could not be removed:",
          absolutePath,
          fileError
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "DELETE /api/application-checklists/documents/[documentsId] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete checklist document.",
      },
      { status: 500 }
    );
  }
}