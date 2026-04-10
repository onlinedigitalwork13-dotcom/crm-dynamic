import { NextRequest, NextResponse } from "next/server";
import { createBranch, getBranches } from "@/lib/branch-service";
import { requireApiRole } from "@/lib/require-api-role";

export async function GET() {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const branches = await getBranches();

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error("GET /api/branches error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch branches",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiRole(["admin", "super_admin"]);

    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json();

    const branch = await createBranch({
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

    return NextResponse.json(
      {
        success: true,
        message: "Branch created successfully",
        branch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/branches error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create branch",
      },
      { status: 500 }
    );
  }
}