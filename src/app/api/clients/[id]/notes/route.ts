import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const formData = await req.formData();
    const content = (formData.get("content") as string)?.trim() || "";

    if (!content) {
      return Response.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    await prisma.clientNote.create({
      data: {
        clientId: id,
        content,
      },
    });

    await logClientActivity({
      clientId: id,
      type: "note_added",
      message: "Client note added",
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Create client note error:", error);
    return Response.json(
      { error: "Failed to create client note" },
      { status: 500 }
    );
  }
}