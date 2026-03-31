import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { processStageAutomation } from "@/lib/workflows/process-stage-automation";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const formData = await req.formData();
    const stageId = (formData.get("stageId") as string) || "";

    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        workflowId: true,
        currentStageId: true,
        currentStage: {
          select: {
            id: true,
            stageName: true,
          },
        },
      },
    });

    if (!existingClient) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    let nextStageName = "Not selected";

    if (stageId) {
      const stage = await prisma.workflowStage.findUnique({
        where: { id: stageId },
        select: { id: true, stageName: true, workflowId: true },
      });

      if (!stage) {
        return Response.json({ error: "Stage not found" }, { status: 404 });
      }

      if (!existingClient.workflowId) {
        return Response.json(
          { error: "Client has no workflow assigned" },
          { status: 400 }
        );
      }

      if (stage.workflowId !== existingClient.workflowId) {
        return Response.json(
          { error: "Selected stage does not belong to the client's workflow" },
          { status: 400 }
        );
      }

      nextStageName = stage.stageName;
    }

    await prisma.client.update({
      where: { id },
      data: {
        currentStageId: stageId || null,
      },
    });

    await logClientActivity({
      clientId: id,
      type: "stage_changed",
      message: stageId
        ? `Stage changed from: ${
            existingClient.currentStage?.stageName || "Not selected"
          } to: ${nextStageName}`
        : "Stage cleared",
    });

    await processStageAutomation({
      clientId: id,
      workflowId: existingClient.workflowId ?? null,
      fromStageId: existingClient.currentStageId ?? null,
      toStageId: stageId || null,
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Update stage error:", error);
    return Response.json(
      { error: "Failed to update client stage" },
      { status: 500 }
    );
  }
}