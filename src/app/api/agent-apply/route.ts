import { prisma } from "@/lib/prisma";

function normalizeRequiredString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalEmail(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmed) ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const referralCode = normalizeRequiredString(body.referralCode);
    const firstName = normalizeRequiredString(body.firstName);
    const lastName = normalizeRequiredString(body.lastName);
    const phone = normalizeRequiredString(body.phone);

    const email = normalizeOptionalEmail(body.email);
    const country = normalizeOptionalString(body.country);
    const notes = normalizeOptionalString(body.notes);

    if (!referralCode) {
      return Response.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !phone) {
      return Response.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    if (body.email && !email) {
      return Response.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const agent = await prisma.subagent.findUnique({
      where: { referralCode },
      select: {
        id: true,
        isActive: true,
        country: true,
      },
    });

    if (!agent || !agent.isActive) {
      return Response.json(
        { error: "This referral link is no longer active" },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        agentId: agent.id,
        firstName,
        lastName,
        email,
        phone,
        country: country ?? agent.country ?? null,
        source: "agent",
        status: "new_lead",
        notes,
        lastActivityAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return Response.json(
      {
        success: true,
        leadId: lead.id,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/agent-apply error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit application",
      },
      { status: 500 }
    );
  }
}