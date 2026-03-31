import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function slugToCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function GET() {
  try {
    const templates = await prisma.documentRequirementTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET checklist templates error:", error);

    return NextResponse.json(
      { error: "Failed to fetch checklist templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const codeInput = typeof body.code === "string" ? body.code.trim() : "";
    const code = codeInput || slugToCode(name);

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Template code is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.documentRequirementTemplate.findFirst({
      where: {
        OR: [{ code }, { name }],
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.code === code
              ? "Template code already exists"
              : "Template name already exists",
        },
        { status: 400 }
      );
    }

    const created = await prisma.documentRequirementTemplate.create({
      data: {
        name,
        code,
        description: normalizeNullableString(body.description),
        category: normalizeNullableString(body.category),
        isRequired:
          typeof body.isRequired === "boolean" ? body.isRequired : true,
        allowMulti:
          typeof body.allowMulti === "boolean" ? body.allowMulti : false,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        sortOrder:
          typeof body.sortOrder === "number" ? body.sortOrder : 999,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Checklist template created successfully",
        template: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST checklist template error:", error);

    return NextResponse.json(
      { error: "Failed to create checklist template" },
      { status: 500 }
    );
  }
}