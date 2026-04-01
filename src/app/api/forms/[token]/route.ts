import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ================= GET =================
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { token } = await params;

    const form = await prisma.intakeFormRequest.findUnique({
      where: { token },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load form" },
      { status: 500 }
    );
  }
}

// ================= POST =================
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { token } = await params;

    const intakeForm = await prisma.intakeFormRequest.findUnique({
      where: { token },
      select: {
        id: true,
        branchId: true,
        title: true,
      },
    });

    if (!intakeForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const formData = await request.formData();

    const firstName = normalizeString(formData.get("firstName"));
    const lastName = normalizeString(formData.get("lastName"));
    const phone = normalizeString(formData.get("phone"));
    const email = normalizeString(formData.get("email"));

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    const submission = await prisma.intakeFormSubmission.create({
      data: {
        intakeFormRequestId: intakeForm.id,
        branchId: intakeForm.branchId,
        firstName,
        lastName,
        phone,
        email,
        status: "new",
      },
    });

    const users = await prisma.user.findMany({
      where: {
        branchId: intakeForm.branchId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      users.map((user: { id: string }) =>
        createNotification({
          userId: user.id,
          title: "New Lead Received",
          message: `${firstName} ${lastName} submitted a new inquiry`,
          type: "lead_created",
          link: "/intake-submissions",
        })
      )
    );

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("POST /api/forms/[token] error:", error);

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}