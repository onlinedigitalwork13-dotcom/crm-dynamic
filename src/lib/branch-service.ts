import { prisma } from "@/lib/prisma";

function normalizeNullableString(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: string, fieldLabel: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return trimmed;
}

function normalizeCode(value?: string | null) {
  const normalized = normalizeNullableString(value);
  return normalized ? normalized.toUpperCase() : null;
}

export async function getBranches() {
  return prisma.branch.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
        },
      },
    },
  });
}

export async function getBranchById(id: string) {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
        },
      },
    },
  });

  if (!branch) {
    throw new Error("Branch not found.");
  }

  return branch;
}

export async function createBranch(data: {
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}) {
  const name = normalizeRequiredString(data.name, "Branch name");
  const code = normalizeCode(data.code) ?? `BR-${Date.now()}`;

  const existing = await prisma.branch.findUnique({
    where: { code },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A branch with this code already exists.");
  }

  return prisma.branch.create({
    data: {
      name,
      code,
      address: normalizeNullableString(data.address) ?? null,
      city: normalizeNullableString(data.city) ?? null,
      country: normalizeNullableString(data.country) ?? null,
      phone: normalizeNullableString(data.phone) ?? null,
      email: normalizeNullableString(data.email) ?? null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateBranch(
  id: string,
  data: {
    name?: string;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    isActive?: boolean;
  }
) {
  const existing = await prisma.branch.findUnique({
    where: { id },
    select: { id: true, code: true },
  });

  if (!existing) {
    throw new Error("Branch not found.");
  }

  let nextCode: string | undefined;

  if (data.code !== undefined) {
    const normalizedCode = normalizeCode(data.code);

    if (!normalizedCode) {
      throw new Error("Branch code cannot be empty.");
    }

    const duplicate = await prisma.branch.findFirst({
      where: {
        code: normalizedCode,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error("Another branch with this code already exists.");
    }

    nextCode = normalizedCode;
  }

  return prisma.branch.update({
    where: { id },
    data: {
      name:
        data.name !== undefined
          ? normalizeRequiredString(data.name, "Branch name")
          : undefined,
      code: nextCode,
      address: normalizeNullableString(data.address),
      city: normalizeNullableString(data.city),
      country: normalizeNullableString(data.country),
      phone: normalizeNullableString(data.phone),
      email: normalizeNullableString(data.email),
      isActive: data.isActive,
    },
  });
}

export async function deleteBranch(id: string) {
  const existing = await prisma.branch.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Branch not found.");
  }

  if (existing._count.users > 0) {
    throw new Error(
      "This branch cannot be deleted because users are still assigned to it."
    );
  }

  if (existing._count.clients > 0) {
    throw new Error(
      "This branch cannot be deleted because clients are linked to it."
    );
  }

  return prisma.branch.delete({
    where: { id },
  });
}