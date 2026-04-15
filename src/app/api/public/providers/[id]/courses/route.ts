import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const courses = await prisma.course.findMany({
      where: {
        providerId: id,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        level: true,
        campus: true,
        intakeMonths: true,
        duration: true,
      },
    });

    return NextResponse.json({ items: courses });
  } catch (error) {
    console.error("Failed to load public provider courses:", error);

    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 }
    );
  }
}