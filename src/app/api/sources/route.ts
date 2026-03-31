import { NextRequest, NextResponse } from "next/server";
import { getLeadSources, createLeadSource } from "@/lib/source-service";

export async function GET() {
  try {
    const sources = await getLeadSources();

    return NextResponse.json(sources);
  } catch (error) {
    console.error("GET sources error:", error);

    return NextResponse.json(
      { error: "Failed to fetch lead sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const source = await createLeadSource({
      name: body.name,
      description: body.description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead source created successfully",
        source,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST source error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create lead source",
      },
      { status: 500 }
    );
  }
}