import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeOptionalEmail(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmed) ? trimmed : null;
}

function buildReferralCode() {
  return `AGT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function generateUniqueReferralCode() {
  for (let i = 0; i < 10; i++) {
    const referralCode = buildReferralCode();

    const existing = await prisma.subagent.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!existing) {
      return referralCode;
    }
  }

  throw new Error("Failed to generate unique referral code");
}

function mapAgentResponse(
  subagent: {
    id: string;
    name: string;
    contact: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    referralCode: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    clients: { id: string }[];
    leads: { id: string; status: string }[];
  }
) {
  return {
    ...subagent,
    activeClientsCount: subagent.clients.length,
    totalLeadsCount: subagent.leads.length,
    openLeadsCount: subagent.leads.filter(
      (lead) => lead.status !== "converted" && lead.status !== "closed"
    ).length,
    referralLink: `/apply/${subagent.referralCode}`,
  };
}

export async function GET() {
  try {
    const subagents = await prisma.subagent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        clients: {
          select: {
            id: true,
          },
        },
        leads: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return Response.json(subagents.map(mapAgentResponse));
  } catch (error) {
    console.error("Fetch agents error:", error);

    return Response.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = normalizeRequiredString(body.name);
    const contact = normalizeOptionalString(body.contact);
    const email = normalizeOptionalEmail(body.email);
    const phone = normalizeOptionalString(body.phone);
    const country = normalizeOptionalString(body.country);
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : true;

    if (!name) {
      return Response.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    if (body.email && !email) {
      return Response.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const referralCode = await generateUniqueReferralCode();

    const subagent = await prisma.subagent.create({
      data: {
        name,
        contact,
        email,
        phone,
        country,
        referralCode,
        isActive,
      },
      include: {
        clients: {
          select: {
            id: true,
          },
        },
        leads: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return Response.json(mapAgentResponse(subagent), { status: 201 });
  } catch (error) {
    console.error("Create agent error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "An agent with this unique value already exists" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}