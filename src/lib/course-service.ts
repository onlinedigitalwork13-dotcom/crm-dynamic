import { prisma } from "@/lib/prisma";

export type CreateCourseInput = {
  providerId: string;
  name: string;

  code?: string;
  level?: string;
  category?: string;
  studyMode?: string;

  duration?: string;
  durationValue?: number | null;
  durationUnit?: string;

  tuitionFee?: number | null;
  applicationFee?: number | null;
  materialFee?: number | null;
  currency?: string;

  intakeMonths?: string;
  campus?: string;

  entryRequirements?: string;
  englishRequirements?: string;

  description?: string;
  notes?: string;

  sourceType?: string;
  syncStatus?: string;

  isActive?: boolean;
};

export type UpdateCourseInput = {
  name?: string;

  code?: string;
  level?: string;
  category?: string;
  studyMode?: string;

  duration?: string;
  durationValue?: number | null;
  durationUnit?: string;

  tuitionFee?: number | null;
  applicationFee?: number | null;
  materialFee?: number | null;
  currency?: string;

  intakeMonths?: string;
  campus?: string;

  entryRequirements?: string;
  englishRequirements?: string;

  description?: string;
  notes?: string;

  sourceType?: string;
  syncStatus?: string;

  isActive?: boolean;
};

export async function getAllCourses(providerId?: string) {
  return prisma.course.findMany({
    where: providerId ? { providerId } : undefined,
    include: {
      provider: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      provider: true,
    },
  });
}

export async function getCoursesByProviderId(providerId: string) {
  return prisma.course.findMany({
    where: { providerId },
    include: {
      provider: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function createCourse(data: CreateCourseInput) {
  return prisma.course.create({
    data: {
      providerId: data.providerId,
      name: data.name.trim(),

      code: data.code?.trim() || null,
      level: data.level?.trim() || null,
      category: data.category?.trim() || null,
      studyMode: data.studyMode?.trim() || null,

      duration: data.duration?.trim() || null,
      durationValue: data.durationValue ?? null,
      durationUnit: data.durationUnit?.trim() || null,

      tuitionFee: data.tuitionFee ?? null,
      applicationFee: data.applicationFee ?? null,
      materialFee: data.materialFee ?? null,
      currency: data.currency?.trim() || null,

      intakeMonths: data.intakeMonths?.trim() || null,
      campus: data.campus?.trim() || null,

      entryRequirements: data.entryRequirements?.trim() || null,
      englishRequirements: data.englishRequirements?.trim() || null,

      description: data.description?.trim() || null,
      notes: data.notes?.trim() || null,

      sourceType: data.sourceType?.trim() || "manual",
      syncStatus: data.syncStatus?.trim() || "manual",

      isActive: data.isActive ?? true,
    },
    include: {
      provider: true,
    },
  });
}

export async function updateCourse(id: string, data: UpdateCourseInput) {
  return prisma.course.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),

      ...(data.code !== undefined && { code: data.code?.trim() || null }),
      ...(data.level !== undefined && { level: data.level?.trim() || null }),
      ...(data.category !== undefined && {
        category: data.category?.trim() || null,
      }),
      ...(data.studyMode !== undefined && {
        studyMode: data.studyMode?.trim() || null,
      }),

      ...(data.duration !== undefined && {
        duration: data.duration?.trim() || null,
      }),
      ...(data.durationValue !== undefined && {
        durationValue: data.durationValue,
      }),
      ...(data.durationUnit !== undefined && {
        durationUnit: data.durationUnit?.trim() || null,
      }),

      ...(data.tuitionFee !== undefined && { tuitionFee: data.tuitionFee }),
      ...(data.applicationFee !== undefined && {
        applicationFee: data.applicationFee,
      }),
      ...(data.materialFee !== undefined && {
        materialFee: data.materialFee,
      }),
      ...(data.currency !== undefined && {
        currency: data.currency?.trim() || null,
      }),

      ...(data.intakeMonths !== undefined && {
        intakeMonths: data.intakeMonths?.trim() || null,
      }),
      ...(data.campus !== undefined && {
        campus: data.campus?.trim() || null,
      }),

      ...(data.entryRequirements !== undefined && {
        entryRequirements: data.entryRequirements?.trim() || null,
      }),
      ...(data.englishRequirements !== undefined && {
        englishRequirements: data.englishRequirements?.trim() || null,
      }),

      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
      }),
      ...(data.notes !== undefined && {
        notes: data.notes?.trim() || null,
      }),

      ...(data.sourceType !== undefined && {
        sourceType: data.sourceType?.trim() || null,
      }),
      ...(data.syncStatus !== undefined && {
        syncStatus: data.syncStatus?.trim() || null,
      }),

      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      provider: true,
    },
  });
}

export async function deleteCourse(id: string) {
  return prisma.course.delete({
    where: { id },
  });
}