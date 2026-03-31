import { prisma } from "@/lib/prisma";

const RESULT_LIMIT_PER_GROUP = 5;

export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "client" | "provider" | "course" | "application";
};

export type GlobalSearchResult = {
  query: string;
  clients: SearchItem[];
  providers: SearchItem[];
  courses: SearchItem[];
  applications: SearchItem[];
};

export type GlobalSearchContext = {
  userId: string;
  roleName?: string | null;
  branchId?: string | null;
  isActive?: boolean;
};

function cleanQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export async function globalSearch(
  rawQuery: string,
  context: GlobalSearchContext
): Promise<GlobalSearchResult> {
  const query = cleanQuery(rawQuery);
  const role = normalizeRole(context.roleName);

  if (!context.userId) {
    throw new Error("UNAUTHORIZED");
  }

  if (!context.isActive) {
    throw new Error("INACTIVE_ACCOUNT");
  }

  if (!query) {
    return {
      query: "",
      clients: [],
      providers: [],
      courses: [],
      applications: [],
    };
  }

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || isSuperAdmin;
  const hasBranchScope = !isSuperAdmin && !isAdmin && !!context.branchId;

  const clientWhere = {
    AND: [
      {
        OR: [
          { firstName: { contains: query, mode: "insensitive" as const } },
          { lastName: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
          { passport: { contains: query, mode: "insensitive" as const } },
        ],
      },
      ...(hasBranchScope
        ? [{ branchId: context.branchId as string }]
        : []),
    ],
  };

  const providerWhere = {
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { code: { contains: query, mode: "insensitive" as const } },
      { country: { contains: query, mode: "insensitive" as const } },
      { city: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const courseWhere = {
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { level: { contains: query, mode: "insensitive" as const } },
      { campus: { contains: query, mode: "insensitive" as const } },
      {
        provider: {
          name: { contains: query, mode: "insensitive" as const },
        },
      },
      {
        provider: {
          code: { contains: query, mode: "insensitive" as const },
        },
      },
    ],
  };

  const applicationWhere = {
    AND: [
      {
        OR: [
          { applicationNo: { contains: query, mode: "insensitive" as const } },
          { intake: { contains: query, mode: "insensitive" as const } },
          { status: { contains: query, mode: "insensitive" as const } },
          {
            client: {
              firstName: { contains: query, mode: "insensitive" as const },
            },
          },
          {
            client: {
              lastName: { contains: query, mode: "insensitive" as const },
            },
          },
          {
            provider: {
              name: { contains: query, mode: "insensitive" as const },
            },
          },
          {
            course: {
              name: { contains: query, mode: "insensitive" as const },
            },
          },
        ],
      },
      ...(hasBranchScope
        ? [
            {
              client: {
                branchId: context.branchId as string,
              },
            },
          ]
        : []),
    ],
  };

  const [clients, providers, courses, applications] = await Promise.all([
    prisma.client.findMany({
      where: clientWhere,
      take: RESULT_LIMIT_PER_GROUP,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    }),

    prisma.provider.findMany({
      where: providerWhere,
      take: RESULT_LIMIT_PER_GROUP,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        city: true,
      },
    }),

    prisma.course.findMany({
      where: courseWhere,
      take: RESULT_LIMIT_PER_GROUP,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        level: true,
        campus: true,
        provider: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.clientApplication.findMany({
      where: applicationWhere,
      take: RESULT_LIMIT_PER_GROUP,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        applicationNo: true,
        intake: true,
        intakeYear: true,
        status: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    query,
    clients: clients.map((client) => ({
      id: client.id,
      type: "client",
      title: `${client.firstName} ${client.lastName}`.trim(),
      subtitle: [client.email, client.phone].filter(Boolean).join(" • "),
      href: `/clients/${client.id}`,
    })),

    providers: providers.map((provider) => ({
      id: provider.id,
      type: "provider",
      title: provider.name,
      subtitle: [provider.code, provider.city, provider.country]
        .filter(Boolean)
        .join(" • "),
      href: `/providers/${provider.id}`,
    })),

    courses: courses.map((course) => ({
      id: course.id,
      type: "course",
      title: course.name,
      subtitle: [course.provider?.name, course.level, course.campus]
        .filter(Boolean)
        .join(" • "),
      href: `/courses-config/${course.id}`,
    })),

    applications: applications.map((application) => ({
      id: application.id,
      type: "application",
      title:
        application.applicationNo?.trim() ||
        `${application.client.firstName} ${application.client.lastName}`.trim(),
      subtitle: [
        application.provider.name,
        application.course.name,
        [application.intake, application.intakeYear].filter(Boolean).join(" "),
        application.status,
      ]
        .filter(Boolean)
        .join(" • "),
      href: `/applications/${application.id}`,
    })),
  };
}