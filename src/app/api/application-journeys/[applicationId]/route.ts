import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOrGetApplicationJourney,
  deleteApplicationJourney,
  getApplicationJourneyByApplicationId,
  updateApplicationJourney,
} from "@/lib/application-journey-service";

type RouteContext = {
  params: Promise<{
    applicationId: string;
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

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { applicationId } = await params;

    const journey = await getApplicationJourneyByApplicationId(applicationId);

    if (!journey) {
      return NextResponse.json(
        { error: "Application journey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(journey, { status: 200 });
  } catch (error) {
    console.error("Error fetching application journey:", error);
    return NextResponse.json(
      { error: "Failed to fetch application journey" },
      { status: 500 }
    );
  }
}

export async function POST(_: NextRequest, { params }: RouteContext) {
  try {
    const { applicationId } = await params;

    const application = await prisma.clientApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const journey = await createOrGetApplicationJourney(applicationId);

    return NextResponse.json(journey, { status: 200 });
  } catch (error) {
    console.error("Error initializing application journey:", error);
    return NextResponse.json(
      { error: "Failed to initialize application journey" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { applicationId } = await params;
    const body = await request.json();

    const application = await prisma.clientApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const existingJourney = await prisma.applicationJourney.findUnique({
      where: { applicationId },
    });

    if (!existingJourney) {
      await createOrGetApplicationJourney(applicationId);
    }

    const updated = await updateApplicationJourney(applicationId, {
      ...(body.offerStatus !== undefined && {
        offerStatus: String(body.offerStatus),
      }),
      ...(body.offerType !== undefined && {
        offerType: body.offerType,
      }),
      ...(body.offerConditions !== undefined && {
        offerConditions: body.offerConditions,
      }),
      ...(body.offerReceivedAt !== undefined && {
        offerReceivedAt: parseDate(body.offerReceivedAt),
      }),
      ...(body.offerAcceptedAt !== undefined && {
        offerAcceptedAt: parseDate(body.offerAcceptedAt),
      }),

      ...(body.coeStatus !== undefined && {
        coeStatus: String(body.coeStatus),
      }),
      ...(body.coeNumber !== undefined && {
        coeNumber: body.coeNumber,
      }),
      ...(body.coeIssuedAt !== undefined && {
        coeIssuedAt: parseDate(body.coeIssuedAt),
      }),

      ...(body.visaStatus !== undefined && {
        visaStatus: String(body.visaStatus),
      }),
      ...(body.visaFileNumber !== undefined && {
        visaFileNumber: body.visaFileNumber,
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
        remarks: body.remarks,
      }),
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating application journey:", error);
    return NextResponse.json(
      { error: "Failed to update application journey" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { applicationId } = await params;

    const existing = await prisma.applicationJourney.findUnique({
      where: { applicationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Application journey not found" },
        { status: 404 }
      );
    }

    await deleteApplicationJourney(applicationId);

    return NextResponse.json(
      { message: "Application journey deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting application journey:", error);
    return NextResponse.json(
      { error: "Failed to delete application journey" },
      { status: 500 }
    );
  }
}