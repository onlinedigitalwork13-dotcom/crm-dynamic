import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const subagents = await prisma.subagent.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return Response.json(subagents);
  } catch (error) {
    console.error("Fetch subagents error:", error);
    return Response.json(
      { error: "Failed to fetch subagents" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const subagent = await prisma.subagent.create({
      data: {
        name: body.name,
        contact: body.contact || null,
        email: body.email || null,
        phone: body.phone || null,
        country: body.country || null,
        isActive: body.isActive ?? true,
      },
    });

    return Response.json(subagent, { status: 201 });
  } catch (error) {
    console.error("Create subagent error:", error);
    return Response.json(
      { error: "Failed to create subagent" },
      { status: 500 }
    );
  }
}