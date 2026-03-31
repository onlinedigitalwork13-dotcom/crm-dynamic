import { NextRequest, NextResponse } from "next/server";
import { getBranchById, updateBranch } from "@/lib/branch-service";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const branch = await getBranchById(id);

    return NextResponse.json(branch);
  } catch (error) {
    console.error("GET branch by id error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch branch",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const body = await request.json();

    const branch = await updateBranch(id, {
      name: body.name,
      code: body.code,
      address: body.address,
      city: body.city,
      country: body.country,
      phone: body.phone,
      email: body.email,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("PATCH branch error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update branch",
      },
      { status: 500 }
    );
  }
}