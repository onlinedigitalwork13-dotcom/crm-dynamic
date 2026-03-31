import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const application = await prisma.clientApplication.findUnique({
      where: { id },
      select: {
        id: true,
        journey: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!application.journey) {
      return NextResponse.json(
        { error: "Application journey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application.journey);
  } catch (error) {
    console.error("GET /api/applications/[id]/journey error:", error);

    return NextResponse.json(
      { error: "Failed to fetch application journey" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const application = await prisma.clientApplication.findUnique({
      where: { id },
      select: {
        id: true,
        journey: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!application.journey) {
      return NextResponse.json(
        { error: "Application journey not found" },
        { status: 404 }
      );
    }

    const updatedJourney = await prisma.applicationJourney.update({
      where: {
        id: application.journey.id,
      },
      data: {
        offerStatus:
          typeof body.offerStatus === "string" && body.offerStatus.trim()
            ? body.offerStatus.trim()
            : undefined,

        offerType: parseOptionalString(body.offerType),
        offerConditions: parseOptionalString(body.offerConditions),
        offerReceivedAt: parseOptionalDate(body.offerReceivedAt),
        offerAcceptedAt: parseOptionalDate(body.offerAcceptedAt),

        coeStatus:
          typeof body.coeStatus === "string" && body.coeStatus.trim()
            ? body.coeStatus.trim()
            : undefined,

        coeNumber: parseOptionalString(body.coeNumber),
        coeIssuedAt: parseOptionalDate(body.coeIssuedAt),

        visaStatus:
          typeof body.visaStatus === "string" && body.visaStatus.trim()
            ? body.visaStatus.trim()
            : undefined,

        visaFileNumber: parseOptionalString(body.visaFileNumber),
        visaLodgedAt: parseOptionalDate(body.visaLodgedAt),
        visaGrantedAt: parseOptionalDate(body.visaGrantedAt),
        visaRefusedAt: parseOptionalDate(body.visaRefusedAt),

        remarks: parseOptionalString(body.remarks),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application journey updated successfully",
      journey: updatedJourney,
    });
  } catch (error) {
    console.error("PATCH /api/applications/[id]/journey error:", error);

    return NextResponse.json(
      { error: "Failed to update application journey" },
      { status: 500 }
    );
  }
}