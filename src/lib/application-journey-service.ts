import { prisma } from "@/lib/prisma";

export type CreateApplicationJourneyInput = {
  applicationId: string;
};

export type UpdateApplicationJourneyInput = {
  offerStatus?: string;
  offerType?: string | null;
  offerConditions?: string | null;
  offerReceivedAt?: Date | null;
  offerAcceptedAt?: Date | null;

  coeStatus?: string;
  coeNumber?: string | null;
  coeIssuedAt?: Date | null;

  visaStatus?: string;
  visaFileNumber?: string | null;
  visaLodgedAt?: Date | null;
  visaGrantedAt?: Date | null;
  visaRefusedAt?: Date | null;

  remarks?: string | null;
};

export async function getApplicationJourneyByApplicationId(applicationId: string) {
  return prisma.applicationJourney.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          client: true,
          provider: true,
          course: true,
        },
      },
    },
  });
}

export async function createApplicationJourney(
  data: CreateApplicationJourneyInput
) {
  return prisma.applicationJourney.create({
    data: {
      applicationId: data.applicationId,
      offerStatus: "not_started",
      coeStatus: "not_started",
      visaStatus: "not_started",
    },
    include: {
      application: {
        include: {
          client: true,
          provider: true,
          course: true,
        },
      },
    },
  });
}

export async function createOrGetApplicationJourney(applicationId: string) {
  const existing = await prisma.applicationJourney.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          client: true,
          provider: true,
          course: true,
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.applicationJourney.create({
    data: {
      applicationId,
      offerStatus: "not_started",
      coeStatus: "not_started",
      visaStatus: "not_started",
    },
    include: {
      application: {
        include: {
          client: true,
          provider: true,
          course: true,
        },
      },
    },
  });
}

export async function updateApplicationJourney(
  applicationId: string,
  data: UpdateApplicationJourneyInput
) {
  return prisma.applicationJourney.update({
    where: { applicationId },
    data: {
      ...(data.offerStatus !== undefined && {
        offerStatus: data.offerStatus.trim(),
      }),
      ...(data.offerType !== undefined && {
        offerType: data.offerType?.trim() || null,
      }),
      ...(data.offerConditions !== undefined && {
        offerConditions: data.offerConditions?.trim() || null,
      }),
      ...(data.offerReceivedAt !== undefined && {
        offerReceivedAt: data.offerReceivedAt,
      }),
      ...(data.offerAcceptedAt !== undefined && {
        offerAcceptedAt: data.offerAcceptedAt,
      }),

      ...(data.coeStatus !== undefined && {
        coeStatus: data.coeStatus.trim(),
      }),
      ...(data.coeNumber !== undefined && {
        coeNumber: data.coeNumber?.trim() || null,
      }),
      ...(data.coeIssuedAt !== undefined && {
        coeIssuedAt: data.coeIssuedAt,
      }),

      ...(data.visaStatus !== undefined && {
        visaStatus: data.visaStatus.trim(),
      }),
      ...(data.visaFileNumber !== undefined && {
        visaFileNumber: data.visaFileNumber?.trim() || null,
      }),
      ...(data.visaLodgedAt !== undefined && {
        visaLodgedAt: data.visaLodgedAt,
      }),
      ...(data.visaGrantedAt !== undefined && {
        visaGrantedAt: data.visaGrantedAt,
      }),
      ...(data.visaRefusedAt !== undefined && {
        visaRefusedAt: data.visaRefusedAt,
      }),

      ...(data.remarks !== undefined && {
        remarks: data.remarks?.trim() || null,
      }),
    },
    include: {
      application: {
        include: {
          client: true,
          provider: true,
          course: true,
        },
      },
    },
  });
}

export async function deleteApplicationJourney(applicationId: string) {
  return prisma.applicationJourney.delete({
    where: { applicationId },
  });
}