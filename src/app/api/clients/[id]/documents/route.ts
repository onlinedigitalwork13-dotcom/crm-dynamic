import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  return NextResponse.json({
    ok: true,
    route: "client documents route working",
    clientId: id,
  });
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  let absoluteFilePath = "";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "clients");
    await mkdir(uploadDir, { recursive: true });

    const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    absoluteFilePath = path.join(uploadDir, safeFileName);
    const publicFilePath = `/uploads/clients/${safeFileName}`;

    await writeFile(absoluteFilePath, buffer);

    await prisma.clientDocument.create({
      data: {
        clientId: id,
        title,
        fileName: file.name,
        filePath: publicFilePath,
        fileType: file.type || null,
        fileSize: file.size || null,
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

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url), 303);
  } catch (error) {
    console.error("Upload client document error:", error);

    if (absoluteFilePath) {
      try {
        await unlink(absoluteFilePath);
      } catch {
        // ignore cleanup failure
      }
    }

    return NextResponse.json(
      {
        error: "Failed to upload client document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}