import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-]+/g, "-");
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const documents = await prisma.clientDocument.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      filePath: true,
      fileType: true,
      fileSize: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    clientId: id,
    documents,
  });
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const formData = await req.formData();
    const title = ((formData.get("title") as string) || "").trim();
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json(
        { error: "Document title is required" },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Document file is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error:
            "File is too large. Please upload files smaller than 4.5 MB.",
        },
        { status: 400 }
      );
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const safeFileName = sanitizeFileName(file.name);
    const pathname = `clients/${id}/${Date.now()}-${safeFileName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    const document = await prisma.clientDocument.create({
      data: {
        clientId: id,
        title,
        fileName: file.name,
        filePath: blob.url,
        fileType: file.type || null,
        fileSize: file.size || null,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        filePath: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    try {
      await logClientActivity({
        clientId: id,
        type: "document_uploaded",
        message: `Document uploaded: ${title}`,
      });
    } catch (activityError) {
      console.error("Client activity log failed:", activityError);
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Upload client document error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload client document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}