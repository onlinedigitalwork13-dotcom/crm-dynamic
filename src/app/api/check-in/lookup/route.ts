import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(value: unknown) {
  const email = normalizeString(value);
  return email ? email.toLowerCase() : null;
}

function normalizePhoneDigits(value: unknown) {
  const phone = normalizeString(value);
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const phone = normalizeString(body.phone);
    const email = normalizeEmail(body.email);
    const passportNumber = normalizeString(body.passportNumber);
    const phoneDigits = normalizePhoneDigits(body.phone);

    if (!phone && !email && !passportNumber) {
      return NextResponse.json(
        { error: "Phone, email, or passport number is required" },
        { status: 400 }
      );
    }

    const clientIdentifiers = [
      phone ? { phone } : undefined,
      email ? { email } : undefined,
      passportNumber ? { passport: passportNumber } : undefined,
    ].filter(Boolean) as any[];

    if (clientIdentifiers.length > 0) {
      const client = await prisma.client.findFirst({
        where: {
          OR: clientIdentifiers,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passport: true,
          branchId: true,
        },
      });

      if (client) {
        return NextResponse.json({
          success: true,
          mode: "existing_client",
          client,
        });
      }
    }

    if (phoneDigits) {
      const clientByNormalizedPhone = await prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passport: true,
          branchId: true,
        },
        take: 100,
      });

      const matchedClient = clientByNormalizedPhone.find((client) => {
        const existingDigits = (client.phone ?? "").replace(/\D/g, "");
        return existingDigits.length > 0 && existingDigits === phoneDigits;
      });

      if (matchedClient) {
        return NextResponse.json({
          success: true,
          mode: "existing_client",
          client: matchedClient,
        });
      }
    }

    const intakeIdentifiers = [
      phone ? { phone } : undefined,
      email ? { email } : undefined,
      passportNumber ? { passportNumber } : undefined,
    ].filter(Boolean) as any[];

    if (intakeIdentifiers.length > 0) {
      const intakeSubmission = await prisma.intakeFormSubmission.findFirst({
        where: {
          OR: intakeIdentifiers,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passportNumber: true,
          branchId: true,
          clientId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (intakeSubmission) {
        return NextResponse.json({
          success: true,
          mode: "existing_intake_submission",
          intakeSubmission,
        });
      }
    }

    if (phoneDigits) {
      const intakeCandidates = await prisma.intakeFormSubmission.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passportNumber: true,
          branchId: true,
          clientId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      const matchedSubmission = intakeCandidates.find((submission) => {
        const existingDigits = (submission.phone ?? "").replace(/\D/g, "");
        return existingDigits.length > 0 && existingDigits === phoneDigits;
      });

      if (matchedSubmission) {
        return NextResponse.json({
          success: true,
          mode: "existing_intake_submission",
          intakeSubmission: matchedSubmission,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: "new",
    });
  } catch (error) {
    console.error("POST /api/check-in/lookup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to lookup check-in",
      },
      { status: 500 }
    );
  }
}