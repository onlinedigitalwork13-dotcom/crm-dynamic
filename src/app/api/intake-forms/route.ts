import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugifyToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const branches = await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const createdBy = await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (!branches || !createdBy) {
      return NextResponse.json(
        { error: "Branch or user not found for form creation" },
        { status: 400 }
      );
    }

    const title = String(body.title || "").trim();
    const tokenInput = String(body.token || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const token =
      slugifyToken(tokenInput || title) || crypto.randomUUID().slice(0, 8);

    const existing = await prisma.intakeFormRequest.findUnique({
      where: { token },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Token already exists. Please use another token." },
        { status: 400 }
      );
    }

    const created = await prisma.intakeFormRequest.create({
      data: {
        branchId: branches.id,
        createdById: createdBy.id,
        title,
        description: body.description || null,
        token,
        status: body.status || "draft",
        isActive: Boolean(body.isActive),
        publicUrl: `/forms/${token}`,
        qrCodeValue: `/forms/${token}`,
        submitButtonText: body.submitButtonText || "Submit",
        successMessage:
          body.successMessage ||
          "Thank you. Your form has been submitted successfully.",
        formSchema: body.formSchema || [],
        settings: body.settings || {},
        notes: body.notes || null,
        sharedAt: body.status === "active" ? new Date() : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/intake-forms error:", error);
    return NextResponse.json(
      { error: "Failed to create intake form" },
      { status: 500 }
    );
  }
}