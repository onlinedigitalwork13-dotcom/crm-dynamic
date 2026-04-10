import { NextRequest, NextResponse } from "next/server";
import {
  deleteBranch,
  getBranchById,
  updateBranch,
} from "@/lib/branch-service";
import { requireApiRole } from "@/lib/require-api-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;
    const branch = await getBranchById(id);

    return NextResponse.json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("GET /api/branches/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch branch",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;
    const body = await request.json();

    const branch = await updateBranch(id, {
      name: typeof body.name === "string" ? body.name.trim() : "",
      code: typeof body.code === "string" ? body.code.trim() : "",
      address:
        typeof body.address === "string" ? body.address.trim() || null : null,
      city: typeof body.city === "string" ? body.city.trim() || null : null,
      country:
        typeof body.country === "string" ? body.country.trim() || null : null,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      isActive: Boolean(body.isActive),
    });

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("PATCH /api/branches/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update branch",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;

    const result = await deleteBranch(id);

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
      branch: result,
    });
  } catch (error) {
    console.error("DELETE /api/branches/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete branch",
      },
      { status: 500 }
    );
  }
}