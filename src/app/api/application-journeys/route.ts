import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createApplicationJourney,
  getApplicationJourneyByApplicationId,
} from "@/lib/application-journey-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const applicationId = String(body.applicationId || "").trim();

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    const application = await prisma.clientApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.applicationJourney.findUnique({
      where: { applicationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Journey already exists for this application" },
        { status: 409 }
      );
    }

    const journey = await createApplicationJourney({ applicationId });

    return NextResponse.json(journey, { status: 201 });
  } catch (error) {
    console.error("Error creating application journey:", error);
    return NextResponse.json(
      { error: "Failed to create application journey" },
      { status: 500 }
    );
  }
}