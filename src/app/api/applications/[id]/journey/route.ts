import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOrGetApplicationJourney,
  getApplicationJourneyByApplicationId,
  updateApplicationJourney,
} from "@/lib/application-journey-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const application = await prisma.clientApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const journey = await createOrGetApplicationJourney(id);

    return NextResponse.json(journey, { status: 200 });
  } catch (error) {
    console.error("Error fetching application journey:", error);

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
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const existingJourney = await getApplicationJourneyByApplicationId(id);

    if (!existingJourney) {
      await createOrGetApplicationJourney(id);
    }

    const updatedJourney = await updateApplicationJourney(id, {
      ...(body.offerStatus !== undefined && {
        offerStatus: String(body.offerStatus).trim(),
      }),
      ...(body.offerType !== undefined && {
        offerType: parseOptionalString(body.offerType),
      }),
      ...(body.offerConditions !== undefined && {
        offerConditions: parseOptionalString(body.offerConditions),
      }),
      ...(body.offerReceivedAt !== undefined && {
        offerReceivedAt: parseDate(body.offerReceivedAt),
      }),
      ...(body.offerAcceptedAt !== undefined && {
        offerAcceptedAt: parseDate(body.offerAcceptedAt),
      }),

      ...(body.coeStatus !== undefined && {
        coeStatus: String(body.coeStatus).trim(),
      }),
      ...(body.coeNumber !== undefined && {
        coeNumber: parseOptionalString(body.coeNumber),
      }),
      ...(body.coeIssuedAt !== undefined && {
        coeIssuedAt: parseDate(body.coeIssuedAt),
      }),

      ...(body.visaStatus !== undefined && {
        visaStatus: String(body.visaStatus).trim(),
      }),
      ...(body.visaFileNumber !== undefined && {
        visaFileNumber: parseOptionalString(body.visaFileNumber),
      }),
      ...(body.visaLodgedAt !== undefined && {
        visaLodgedAt: parseDate(body.visaLodgedAt),
      }),
      ...(body.visaGrantedAt !== undefined && {
        visaGrantedAt: parseDate(body.visaGrantedAt),
      }),
      ...(body.visaRefusedAt !== undefined && {
        visaRefusedAt: parseDate(body.visaRefusedAt),
      }),

      ...(body.remarks !== undefined && {
        remarks: parseOptionalString(body.remarks),
      }),
    });

    return NextResponse.json(updatedJourney, { status: 200 });
  } catch (error) {
    console.error("Error updating application journey:", error);

    return NextResponse.json(
      { error: "Failed to update application journey" },
      { status: 500 }
    );
  }
}