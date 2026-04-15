import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
      },
    });

    return NextResponse.json({ items: providers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}