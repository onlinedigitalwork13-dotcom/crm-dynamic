import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            applications: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider, { status: 200 });
  } catch (error) {
    console.error("Error fetching provider:", error);

    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const name = String(body.name || "").trim();
    const code = body.code?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const duplicateName = await prisma.provider.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "Another provider with this name already exists" },
        { status: 409 }
      );
    }

    if (code) {
      const duplicateCode = await prisma.provider.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Another provider with this code already exists" },
          { status: 409 }
        );
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        name,
        code,
        country: body.country?.trim() || null,
        city: body.city?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        website: body.website?.trim() || null,
        description: body.description?.trim() || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(updatedProvider, { status: 200 });
  } catch (error) {
    console.error("Error updating provider:", error);

    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    if (provider._count.applications > 0) {
      return NextResponse.json(
        { error: "Cannot delete provider because it is linked to applications" },
        { status: 400 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting provider:", error);

    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}