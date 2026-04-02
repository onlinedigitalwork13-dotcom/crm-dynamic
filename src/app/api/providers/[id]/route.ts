import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
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

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider, { status: 200 });
  } catch (error) {
    console.error("Error fetching provider:", error);

    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const name = normalizeString(body.name);
    const code = normalizeString(body.code);

    if (!name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const duplicateName = await prisma.provider.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "Another provider with this name already exists" },
        { status: 409 }
      );
    }

    if (code) {
      const duplicateCode = await prisma.provider.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Another provider with this code already exists" },
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

    const updatedProvider = await prisma.provider.update({
      where: { id },
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

    return NextResponse.json(updatedProvider, { status: 200 });
  } catch (error) {
    console.error("Error updating provider:", error);

    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    if (provider._count.applications > 0) {
      return NextResponse.json(
        { error: "Cannot delete provider because it is linked to applications" },
        { status: 400 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting provider:", error);

    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}