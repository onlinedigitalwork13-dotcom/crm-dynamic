import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.intakeFormSubmission.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const data: {
      status?: "new" | "assigned" | "contacted" | "under_review" | "converted" | "closed";
      internalNotes?: string | null;
      reviewedAt?: Date | null;
      closedAt?: Date | null;
      convertedAt?: Date | null;
    } = {};

    if (body.status) {
      data.status = body.status;

      if (body.status === "under_review") {
        data.reviewedAt = new Date();
      }

      if (body.status === "closed") {
        data.closedAt = new Date();
      }

      if (body.status === "converted") {
        data.convertedAt = new Date();
      }
    }

    if (body.internalNotes !== undefined) {
      data.internalNotes = body.internalNotes || null;
    }

    const updated = await prisma.intakeFormSubmission.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/intake-submissions/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}