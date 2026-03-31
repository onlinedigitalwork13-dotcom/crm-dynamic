import { prisma } from "@/lib/prisma";

export type CreateApplicationInput = {
  clientId: string;
  providerId: string;
  courseId: string;
  intake: string;
  intakeYear?: number | null;
  status?: string;
  applicationNo?: string;
  notes?: string;
  appliedAt?: Date | null;
  offerDate?: Date | null;
};

export type UpdateApplicationInput = {
  providerId?: string;
  courseId?: string;
  intake?: string;
  intakeYear?: number | null;
  status?: string;
  applicationNo?: string | null;
  notes?: string | null;
  appliedAt?: Date | null;
  offerDate?: Date | null;
};

export async function getApplications(filters?: {
  clientId?: string;
  providerId?: string;
  courseId?: string;
  status?: string;
}) {
  return prisma.clientApplication.findMany({
    where: {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.providerId && { providerId: filters.providerId }),
      ...(filters?.courseId && { courseId: filters.courseId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      client: true,
      provider: true,
      course: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getApplicationById(id: string) {
  return prisma.clientApplication.findUnique({
    where: { id },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
    },
  });
}

export async function createApplication(data: CreateApplicationInput) {
  return prisma.clientApplication.create({
    data: {
      clientId: data.clientId,
      providerId: data.providerId,
      courseId: data.courseId,
      intake: data.intake.trim(),
      intakeYear: data.intakeYear ?? null,
      status: data.status?.trim() || "applied",
      applicationNo: data.applicationNo?.trim() || null,
      notes: data.notes?.trim() || null,
      appliedAt: data.appliedAt ?? null,
      offerDate: data.offerDate ?? null,
      journey: {
        create: {
          offerStatus: "not_started",
          coeStatus: "not_started",
          visaStatus: "not_started",
        },
      },
    },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
    },
  });
}

export async function updateApplication(id: string, data: UpdateApplicationInput) {
  return prisma.clientApplication.update({
    where: { id },
    data: {
      ...(data.providerId !== undefined && { providerId: data.providerId }),
      ...(data.courseId !== undefined && { courseId: data.courseId }),
      ...(data.intake !== undefined && { intake: data.intake.trim() }),
      ...(data.intakeYear !== undefined && { intakeYear: data.intakeYear }),
      ...(data.status !== undefined && { status: data.status.trim() }),
      ...(data.applicationNo !== undefined && {
        applicationNo: data.applicationNo?.trim() || null,
      }),
      ...(data.notes !== undefined && {
        notes: data.notes?.trim() || null,
      }),
      ...(data.appliedAt !== undefined && { appliedAt: data.appliedAt }),
      ...(data.offerDate !== undefined && { offerDate: data.offerDate }),
    },
    include: {
      client: true,
      provider: true,
      course: true,
    },
  });
}

export async function deleteApplication(id: string) {
  return prisma.clientApplication.delete({
    where: { id },
  });
}