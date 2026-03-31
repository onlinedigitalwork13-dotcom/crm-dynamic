import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCourse, getAllCourses } from "@/lib/course-service";

function parseTuitionFee(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || undefined;

    const courses = await getAllCourses(providerId);

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const providerId = body.providerId?.trim();
    const name = body.name?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        providerId,
        name,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this name already exists for this provider" },
        { status: 409 }
      );
    }

    const course = await createCourse({
      providerId,
      name,
      level: body.level,
      duration: body.duration,
      tuitionFee: parseTuitionFee(body.tuitionFee),
      intakeMonths: body.intakeMonths,
      campus: body.campus,
      description: body.description,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}