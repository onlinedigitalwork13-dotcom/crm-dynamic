import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function booleanOrDefault(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: providerId } = await context.params;
    const body = await request.json();

    const name = textOrNull(body.name);

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required." },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      );
    }

    const existing = await prisma.course.findFirst({
      where: {
        providerId,
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Course already exists for this provider." },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        providerId,
        name,

        code: textOrNull(body.code),
        level: textOrNull(body.level),
        category: textOrNull(body.category),
        studyMode: textOrNull(body.studyMode),

        duration: textOrNull(body.duration),
        durationValue: numberOrNull(body.durationValue),
        durationUnit: textOrNull(body.durationUnit),

        tuitionFee: numberOrNull(body.tuitionFee),
        applicationFee: numberOrNull(body.applicationFee),
        materialFee: numberOrNull(body.materialFee),
        currency: textOrNull(body.currency) ?? "AUD",

        campus: textOrNull(body.campus),
        intakeMonths: textOrNull(body.intakeMonths),

        entryRequirements: textOrNull(body.entryRequirements),
        englishRequirements: textOrNull(body.englishRequirements),
        description: textOrNull(body.description),
        notes: textOrNull(body.notes),

        isActive: booleanOrDefault(body.isActive, true),

        sourceType: "manual",
        syncStatus: "manual",
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);

    return NextResponse.json(
      { error: "Failed to create course." },
      { status: 500 }
    );
  }
}