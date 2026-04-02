import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "INVALID_DATE";

  return parsed;
}

export async function GET(_: NextRequest) {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            courses: true,
            applications: true,
            contacts: true,
            campuses: true,
            syncSources: true,
            syncLogs: true,
          },
        },
      },
    });

    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    console.error("Error fetching providers:", error);

    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = normalizeString(body.name);
    const code = normalizeString(body.code);

    if (!name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { name },
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: "Provider already exists" },
        { status: 409 }
      );
    }

    if (code) {
      const existingCode = await prisma.provider.findUnique({
        where: { code },
      });

      if (existingCode) {
        return NextResponse.json(
          { error: "Provider code already exists" },
          { status: 409 }
        );
      }
    }

    const lastSyncAt = normalizeDate(body.lastSyncAt);

    if (lastSyncAt === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Invalid lastSyncAt date format" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        code,
        country: normalizeString(body.country),
        city: normalizeString(body.city),
        email: normalizeString(body.email),
        phone: normalizeString(body.phone),
        website: normalizeString(body.website),
        description: normalizeString(body.description),
        isActive: normalizeBoolean(body.isActive, true),

        legalName: normalizeString(body.legalName),
        defaultCurrency: normalizeString(body.defaultCurrency),
        supportEmail: normalizeString(body.supportEmail),
        supportPhone: normalizeString(body.supportPhone),
        admissionEmail: normalizeString(body.admissionEmail),
        financeEmail: normalizeString(body.financeEmail),
        applicationUrl: normalizeString(body.applicationUrl),
        portalUrl: normalizeString(body.portalUrl),
        logoUrl: normalizeString(body.logoUrl),
        address: normalizeString(body.address),
        notes: normalizeString(body.notes),

        syncStatus: normalizeString(body.syncStatus),
        lastSyncAt,
        lastSyncMessage: normalizeString(body.lastSyncMessage),
        autoSyncEnabled: normalizeBoolean(body.autoSyncEnabled, false),
        sourceType: normalizeString(body.sourceType),
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);

    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}