import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCourse, getCourseById, updateCourse } from "@/lib/course-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return Boolean(value);
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
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.code !== undefined && { code: normalizeString(body.code) }),
      ...(body.level !== undefined && { level: normalizeString(body.level) }),
      ...(body.category !== undefined && {
        category: normalizeString(body.category),
      }),
      ...(body.studyMode !== undefined && {
        studyMode: normalizeString(body.studyMode),
      }),
      ...(body.duration !== undefined && {
        duration: normalizeString(body.duration),
      }),
      ...(body.durationValue !== undefined && {
        durationValue: normalizeNumber(body.durationValue),
      }),
      ...(body.durationUnit !== undefined && {
        durationUnit: normalizeString(body.durationUnit),
      }),
      ...(body.tuitionFee !== undefined && {
        tuitionFee: normalizeNumber(body.tuitionFee),
      }),
      ...(body.applicationFee !== undefined && {
        applicationFee: normalizeNumber(body.applicationFee),
      }),
      ...(body.materialFee !== undefined && {
        materialFee: normalizeNumber(body.materialFee),
      }),
      ...(body.currency !== undefined && {
        currency: normalizeString(body.currency),
      }),
      ...(body.intakeMonths !== undefined && {
        intakeMonths: normalizeString(body.intakeMonths),
      }),
      ...(body.campus !== undefined && {
        campus: normalizeString(body.campus),
      }),
      ...(body.entryRequirements !== undefined && {
        entryRequirements: normalizeString(body.entryRequirements),
      }),
      ...(body.englishRequirements !== undefined && {
        englishRequirements: normalizeString(body.englishRequirements),
      }),
      ...(body.description !== undefined && {
        description: normalizeString(body.description),
      }),
      ...(body.notes !== undefined && {
        notes: normalizeString(body.notes),
      }),
      ...(body.sourceType !== undefined && {
        sourceType: normalizeString(body.sourceType),
      }),
      ...(body.syncStatus !== undefined && {
        syncStatus: normalizeString(body.syncStatus),
      }),
      ...(body.isActive !== undefined && {
        isActive: normalizeBoolean(body.isActive),
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