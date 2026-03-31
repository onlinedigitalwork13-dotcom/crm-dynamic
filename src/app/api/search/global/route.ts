import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { isAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiAuth();
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query) {
      return Response.json({
        success: true,
        data: [],
      });
    }

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const clientWhere = {
      AND: [
        !isAdmin(roleName) && branchId ? { branchId } : {},
        {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    };

    const taskWhere = {
      AND: [
        !isAdmin(roleName) && branchId
          ? {
              OR: [
                { assignedTo: { branchId } },
                { client: { branchId } },
              ],
            }
          : {},
        {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
            { status: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    };

    const providerWhere = {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { code: { contains: query, mode: "insensitive" as const } },
        { country: { contains: query, mode: "insensitive" as const } },
      ],
    };

    const [clients, tasks, providers] = await Promise.all([
      prisma.client.findMany({
        where: clientWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
        take: 5,
        orderBy: { firstName: "asc" },
      }),
      prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          status: true,
          clientId: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.provider.findMany({
        where: providerWhere,
        select: {
          id: true,
          name: true,
          code: true,
          country: true,
        },
        take: 5,
        orderBy: { name: "asc" },
      }),
    ]);

    const results = [
      ...clients.map((client) => ({
        id: `client-${client.id}`,
        title: `${client.firstName} ${client.lastName}`,
        subtitle: client.email || client.phone || "Client",
        href: `/clients/${client.id}`,
        type: "client" as const,
      })),
      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `Task • ${task.status}`,
        href: `/tasks`,
        type: "task" as const,
      })),
      ...providers.map((provider) => ({
        id: `provider-${provider.id}`,
        title: provider.name,
        subtitle:
          provider.code || provider.country || "Provider",
        href: `/providers/${provider.id}`,
        type: "page" as const,
      })),
    ];

    return Response.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Global search error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}