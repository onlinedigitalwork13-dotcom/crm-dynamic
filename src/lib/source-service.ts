import { prisma } from "@/lib/prisma";

function normalizeNullableString(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getLeadSources() {
  return prisma.leadSource.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getLeadSourceById(id: string) {
  const source = await prisma.leadSource.findUnique({
    where: { id },
  });

  if (!source) {
    throw new Error("Lead source not found.");
  }

  return source;
}

export async function createLeadSource(data: {
  name: string;
  description?: string | null;
  isActive?: boolean;
}) {
  const name = data.name.trim();

  if (!name) {
    throw new Error("Source name is required.");
  }

  const existing = await prisma.leadSource.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("Lead source already exists.");
  }

  return prisma.leadSource.create({
    data: {
      name,
      description: normalizeNullableString(data.description) ?? null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateLeadSource(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }
) {
  const existing = await prisma.leadSource.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Lead source not found.");
  }

  if (data.name) {
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      throw new Error("Source name is required.");
    }

    const duplicate = await prisma.leadSource.findFirst({
      where: {
        name: trimmedName,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new Error("Another source with this name already exists.");
    }
  }

  return prisma.leadSource.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      description: normalizeNullableString(data.description),
      isActive: data.isActive,
    },
  });
}

export async function toggleLeadSourceStatus(id: string) {
  const source = await prisma.leadSource.findUnique({
    where: { id },
  });

  if (!source) {
    throw new Error("Lead source not found.");
  }

  return prisma.leadSource.update({
    where: { id },
    data: {
      isActive: !source.isActive,
    },
  });
}

export async function deleteLeadSource(id: string) {
  const existing = await prisma.leadSource.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Lead source not found.");
  }

  return prisma.leadSource.delete({
    where: { id },
  });
}