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

export async function getCommunicationTemplates() {
  return prisma.communicationTemplate.findMany({
    orderBy: [
      { isActive: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getCommunicationTemplateById(id: string) {
  const template = await prisma.communicationTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error("Communication template not found.");
  }

  return template;
}

export async function getCommunicationTemplateByKey(key: string) {
  const normalizedKey = normalizeRequiredString(key, "Template key");

  const template = await prisma.communicationTemplate.findUnique({
    where: { key: normalizedKey },
  });

  if (!template) {
    throw new Error("Communication template not found.");
  }

  return template;
}

export async function createCommunicationTemplate(data: {
  name: string;
  key: string;
  description?: string | null;
  channel: "email" | "in_app" | "both";
  subject?: string | null;
  body: string;
  isActive?: boolean;
}) {
  const name = normalizeRequiredString(data.name, "Template name");
  const key = normalizeRequiredString(data.key, "Template key");
  const body = normalizeRequiredString(data.body, "Template body");

  const existing = await prisma.communicationTemplate.findUnique({
    where: { key },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A communication template with this key already exists.");
  }

  return prisma.communicationTemplate.create({
    data: {
      name,
      key,
      description: normalizeNullableString(data.description) ?? null,
      channel: data.channel,
      subject: normalizeNullableString(data.subject) ?? null,
      body,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateCommunicationTemplate(
  id: string,
  data: {
    name?: string;
    key?: string;
    description?: string | null;
    channel?: "email" | "in_app" | "both";
    subject?: string | null;
    body?: string;
    isActive?: boolean;
  }
) {
  const existing = await prisma.communicationTemplate.findUnique({
    where: { id },
    select: { id: true, key: true },
  });

  if (!existing) {
    throw new Error("Communication template not found.");
  }

  let nextKey: string | undefined;

  if (data.key !== undefined) {
    nextKey = normalizeRequiredString(data.key, "Template key");

    const duplicate = await prisma.communicationTemplate.findFirst({
      where: {
        key: nextKey,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error("Another communication template with this key already exists.");
    }
  }

  return prisma.communicationTemplate.update({
    where: { id },
    data: {
      name:
        data.name !== undefined
          ? normalizeRequiredString(data.name, "Template name")
          : undefined,
      key: nextKey,
      description: normalizeNullableString(data.description),
      channel: data.channel,
      subject: normalizeNullableString(data.subject),
      body:
        data.body !== undefined
          ? normalizeRequiredString(data.body, "Template body")
          : undefined,
      isActive: data.isActive,
    },
  });
}

export async function deleteCommunicationTemplate(id: string) {
  const existing = await prisma.communicationTemplate.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Communication template not found.");
  }

  return prisma.communicationTemplate.delete({
    where: { id },
  });
}