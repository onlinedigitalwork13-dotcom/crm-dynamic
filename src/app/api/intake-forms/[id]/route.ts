import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAuth();

    const { id } = await context.params;
    const body = await req.json();

    const {
      title,
      description,
      submitButtonText,
      successMessage,
      formSchema,
      isActive,
      status,
    } = body ?? {};

    const existing = await prisma.intakeFormRequest.findUnique({
      where: { id },
      select: {
        id: true,
        token: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Form not found." },
        { status: 404 }
      );
    }

    const publicPath = `/forms/${existing.token}`;

    const updated = await prisma.intakeFormRequest.update({
      where: { id },
      data: {
        title: title ?? "",
        description: description ?? null,
        submitButtonText: submitButtonText ?? "Submit",
        successMessage: successMessage ?? "Form submitted successfully.",
        publicUrl: publicPath,
        qrCodeValue: publicPath,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        status: status ?? undefined,
        formSchema: formSchema as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        title: true,
        token: true,
        publicUrl: true,
        qrCodeValue: true,
        updatedAt: true,
        isActive: true,
        status: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/intake-forms/[id] failed:", error);

    return NextResponse.json(
      { error: "Failed to update intake form." },
      { status: 500 }
    );
  }
}