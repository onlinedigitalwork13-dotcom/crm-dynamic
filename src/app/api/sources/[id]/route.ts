import { NextRequest, NextResponse } from "next/server";
import {
  getLeadSourceById,
  updateLeadSource,
  deleteLeadSource,
} from "@/lib/source-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const source = await getLeadSourceById(id);

    return NextResponse.json(source);
  } catch (error) {
    console.error("GET source by id error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch lead source",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const source = await updateLeadSource(id, {
      name: body.name,
      description: body.description,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      message: "Lead source updated successfully",
      source,
    });
  } catch (error) {
    console.error("PATCH source error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update lead source",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    await deleteLeadSource(id);

    return NextResponse.json({
      success: true,
      message: "Lead source deleted successfully",
    });
  } catch (error) {
    console.error("DELETE source error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete lead source",
      },
      { status: 500 }
    );
  }
}