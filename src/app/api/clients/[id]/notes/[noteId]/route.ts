import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
    noteId: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id, noteId } = await context.params;

  try {
    await prisma.clientNote.delete({
      where: { id: noteId },
    });

    await logClientActivity({
      clientId: id,
      type: "note_deleted",
      message: "Client note deleted",
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Delete client note error:", error);
    return Response.json(
      { error: "Failed to delete client note" },
      { status: 500 }
    );
  }
}