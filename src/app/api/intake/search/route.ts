import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function buildFullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const firstName = normalizeString(body?.firstName);
    const lastName = normalizeString(body?.lastName);
    const email = normalizeString(body?.email).toLowerCase();
    const phone = normalizePhone(normalizeString(body?.phone));

    if (!firstName && !lastName && !email && !phone) {
      return NextResponse.json(
        {
          exists: false,
          matches: [],
          error: "Provide at least one search value.",
        },
        { status: 400 }
      );
    }

    const orFilters: Prisma.ClientWhereInput[] = [];

    if (email) {
      orFilters.push({
        email: {
          equals: email,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (phone) {
      orFilters.push({
        phone: {
          equals: phone,
        },
      });
    }

    if (firstName && lastName) {
      orFilters.push({
        AND: [
          {
            firstName: {
              equals: firstName,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            lastName: {
              equals: lastName,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      });
    }

    const matches = await prisma.client.findMany({
      where: {
        OR: orFilters,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        branchId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const formattedMatches = matches.map((client) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      fullName: buildFullName(client.firstName, client.lastName),
      email: client.email,
      phone: client.phone,
      branchId: client.branchId,
      createdAt: client.createdAt,
    }));

    return NextResponse.json({
      exists: formattedMatches.length > 0,
      matches: formattedMatches,
    });
  } catch (error) {
    console.error("POST /api/intake/search error:", error);

    return NextResponse.json(
      {
        exists: false,
        matches: [],
        error: "Failed to search students",
      },
      { status: 500 }
    );
  }
}