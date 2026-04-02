import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function n(v: any) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(v: any) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export async function POST(req: NextRequest, { params }: any) {
  try {
    const { id: providerId } = params;
    const body = await req.json();

    const name = n(body.name);

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    // optional duplicate protection
    const existing = await prisma.course.findFirst({
      where: {
        providerId,
        name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Course already exists for this provider" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        providerId,
        name,

        code: n(body.code),
        level: n(body.level),
        category: n(body.category),
        studyMode: n(body.studyMode),

        duration: n(body.duration),
        durationValue: num(body.durationValue),
        durationUnit: n(body.durationUnit),

        tuitionFee: num(body.tuitionFee),
        applicationFee: num(body.applicationFee),
        materialFee: num(body.materialFee),
        currency: n(body.currency),

        campus: n(body.campus),
        intakeMonths: n(body.intakeMonths),

        entryRequirements: n(body.entryRequirements),
        englishRequirements: n(body.englishRequirements),
        description: n(body.description),

        isActive: body.isActive ?? true,

        // 🔥 sync-ready
        sourceType: "manual",
        syncStatus: "manual",
      },
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