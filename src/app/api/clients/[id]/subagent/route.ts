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
    const subagentId = (formData.get("subagentId") as string) || "";

    let subagentName = "Unassigned";

    if (subagentId) {
      const subagent = await prisma.subagent.findUnique({
        where: { id: subagentId },
        select: { name: true },
      });

      subagentName = subagent?.name || "Unknown Subagent";
    }

    await prisma.client.update({
      where: { id },
      data: {
        subagentId: subagentId || null,
      },
    });

    await logClientActivity({
      clientId: id,
      type: "subagent_assigned",
      message: subagentId
        ? `Subagent assigned: ${subagentName}`
        : "Subagent unassigned",
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Assign subagent error:", error);
    return Response.json(
      { error: "Failed to assign subagent" },
      { status: 500 }
    );
  }
}