import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCourse, getCourseById, updateCourse } from "@/lib/course-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseTuitionFee(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const course = await getCourseById(id);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const nextName =
      body.name !== undefined ? String(body.name).trim() : existingCourse.name;

    if (!nextName) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const duplicateCourse = await prisma.course.findFirst({
      where: {
        providerId: existingCourse.providerId,
        name: nextName,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCourse) {
      return NextResponse.json(
        { error: "Another course with this name already exists for this provider" },
        { status: 409 }
      );
    }

    const updated = await updateCourse(id, {
      ...(body.name !== undefined && { name: String(body.name) }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.tuitionFee !== undefined && {
        tuitionFee: parseTuitionFee(body.tuitionFee),
      }),
      ...(body.intakeMonths !== undefined && {
        intakeMonths: body.intakeMonths,
      }),
      ...(body.campus !== undefined && { campus: body.campus }),
      ...(body.description !== undefined && {
        description: body.description,
      }),
      ...(body.isActive !== undefined && {
        isActive: Boolean(body.isActive),
      }),
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    await deleteCourse(id);

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}