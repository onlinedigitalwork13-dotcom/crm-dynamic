import { prisma } from "@/lib/prisma";

export type CreateCourseInput = {
  providerId: string;
  name: string;
  level?: string;
  duration?: string;
  tuitionFee?: number | null;
  intakeMonths?: string;
  campus?: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateCourseInput = {
  name?: string;
  level?: string;
  duration?: string;
  tuitionFee?: number | null;
  intakeMonths?: string;
  campus?: string;
  description?: string;
  isActive?: boolean;
};

export async function getAllCourses(providerId?: string) {
  return prisma.course.findMany({
    where: providerId ? { providerId } : undefined,
    include: {
      provider: true,
    },
    orderBy: [
      { createdAt: "desc" },
    ],
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
    orderBy: [
      { createdAt: "desc" },
    ],
  });
}

export async function createCourse(data: CreateCourseInput) {
  return prisma.course.create({
    data: {
      providerId: data.providerId,
      name: data.name.trim(),
      level: data.level?.trim() || null,
      duration: data.duration?.trim() || null,
      tuitionFee: data.tuitionFee ?? null,
      intakeMonths: data.intakeMonths?.trim() || null,
      campus: data.campus?.trim() || null,
      description: data.description?.trim() || null,
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
      ...(data.level !== undefined && { level: data.level?.trim() || null }),
      ...(data.duration !== undefined && { duration: data.duration?.trim() || null }),
      ...(data.tuitionFee !== undefined && { tuitionFee: data.tuitionFee }),
      ...(data.intakeMonths !== undefined && {
        intakeMonths: data.intakeMonths?.trim() || null,
      }),
      ...(data.campus !== undefined && { campus: data.campus?.trim() || null }),
      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
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