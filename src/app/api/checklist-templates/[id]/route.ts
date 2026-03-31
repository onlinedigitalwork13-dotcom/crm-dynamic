import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeNullableString(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;

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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.documentRequirementTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Checklist template not found" },
        { status: 404 }
      );
    }

    const nextName =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : existing.name;

    const nextCode =
      typeof body.code === "string" && body.code.trim()
        ? body.code.trim().toUpperCase()
        : body.name
        ? slugToCode(String(body.name))
        : existing.code;

    const duplicate = await prisma.documentRequirementTemplate.findFirst({
      where: {
        id: { not: id },
        OR: [{ code: nextCode }, { name: nextName }],
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            duplicate.code === nextCode
              ? "Template code already exists"
              : "Template name already exists",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.documentRequirementTemplate.update({
      where: { id },
      data: {
        name:
          typeof body.name === "string" && body.name.trim()
            ? body.name.trim()
            : undefined,
        code:
          typeof body.code === "string" && body.code.trim()
            ? body.code.trim().toUpperCase()
            : body.name
            ? slugToCode(String(body.name))
            : undefined,
        description: normalizeNullableString(body.description),
        category: normalizeNullableString(body.category),
        isRequired:
          typeof body.isRequired === "boolean" ? body.isRequired : undefined,
        allowMulti:
          typeof body.allowMulti === "boolean" ? body.allowMulti : undefined,
        isActive:
          typeof body.isActive === "boolean" ? body.isActive : undefined,
        sortOrder:
          typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Checklist template updated successfully",
      template: updated,
    });
  } catch (error) {
    console.error("PATCH checklist template error:", error);

    return NextResponse.json(
      { error: "Failed to update checklist template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const existing = await prisma.documentRequirementTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Checklist template not found" },
        { status: 404 }
      );
    }

    await prisma.documentRequirementTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Checklist template deleted successfully",
    });
  } catch (error) {
    console.error("DELETE checklist template error:", error);

    return NextResponse.json(
      { error: "Failed to delete checklist template" },
      { status: 500 }
    );
  }
}