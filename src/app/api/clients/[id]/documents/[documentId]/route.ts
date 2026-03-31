import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id, documentId } = await context.params;

  try {
    const document = await prisma.clientDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const absoluteFilePath = path.join(process.cwd(), "public", document.filePath);

    try {
      await unlink(absoluteFilePath);
    } catch {
      // Ignore missing file on disk; still remove DB record
    }

    await prisma.clientDocument.delete({
      where: { id: documentId },
    });

    await logClientActivity({
      clientId: id,
      type: "document_deleted",
      message: `Document deleted: ${document.title}`,
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Delete client document error:", error);
    return Response.json(
      { error: "Failed to delete client document" },
      { status: 500 }
    );
  }
}