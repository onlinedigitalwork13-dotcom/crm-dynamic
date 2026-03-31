import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest) {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            courses: true,
            applications: true,
          },
        },
      },
    });

    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    console.error("Error fetching providers:", error);

    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const code = body.code?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { name },
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: "Provider already exists" },
        { status: 409 }
      );
    }

    if (code) {
      const existingCode = await prisma.provider.findUnique({
        where: { code },
      });

      if (existingCode) {
        return NextResponse.json(
          { error: "Provider code already exists" },
          { status: 409 }
        );
      }
    }

    const provider = await prisma.provider.create({
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

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);

    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}