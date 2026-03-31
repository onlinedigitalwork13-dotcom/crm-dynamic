import {
  IntakeFormRequestStatus,
  IntakeFormSubmissionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateIntakeFormRequestInput = {
  branchId: string;
  createdById: string;
  title: string;
  description?: string | null;
  expiresAt?: Date | string | null;
  notes?: string | null;
};

type UpdateIntakeFormRequestInput = {
  title?: string;
  description?: string | null;
  status?: IntakeFormRequestStatus;
  expiresAt?: Date | string | null;
  notes?: string | null;
};

type SubmitIntakeFormInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  nationality?: string | null;
  dateOfBirth?: Date | string | null;
  interestedCountry?: string | null;
  interestedCourse?: string | null;
  studyLevel?: string | null;
  preferredIntake?: string | null;
  preferredYear?: number | null;
  englishTestStatus?: string | null;
  englishTestScore?: string | null;
  passportStatus?: string | null;
  passportNumber?: string | null;
  educationLevel?: string | null;
  workExperience?: string | null;
  budget?: string | null;
  fundingSource?: string | null;
  notes?: string | null;
};

type AssignIntakeFormRequestInput = {
  requestId: string;
  assignedToId: string;
  actingUserId: string;
};

type AssignIntakeSubmissionInput = {
  submissionId: string;
  assignedToId: string;
  actingUserId: string;
};

type ReviewIntakeSubmissionInput = {
  submissionId: string;
  reviewedById: string;
  status?: IntakeFormSubmissionStatus;
  internalNotes?: string | null;
};

type ConvertIntakeSubmissionToClientInput = {
  submissionId: string;
  actingUserId: string;
  sourceId?: string | null;
  workflowId?: string | null;
  currentStageId?: string | null;
  subagentId?: string | null;
};

function normalizeNullableString(
  value?: string | null
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toDateOrNull(value?: Date | string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value provided.");
  }

  return date;
}

function requireNonEmptyString(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function generateToken(length = 24) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";

  for (let i = 0; i < length; i += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return token;
}

async function generateUniqueToken() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = generateToken(24);

    const existing = await prisma.intakeFormRequest.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!existing) {
      return token;
    }
  }

  throw new Error("Failed to generate unique intake form token.");
}

async function getActiveUserWithBranch(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      branchId: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive.");
  }

  return user;
}

async function getActiveAssignableUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      branchId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new Error("Assigned user not found or inactive.");
  }

  return user;
}

export async function createIntakeFormRequest(
  input: CreateIntakeFormRequestInput
) {
  const title = requireNonEmptyString(input.title, "Title");

  const [branch, createdBy] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: input.branchId },
      select: { id: true, isActive: true },
    }),
    getActiveUserWithBranch(input.createdById),
  ]);

  if (!branch || !branch.isActive) {
    throw new Error("Branch not found or inactive.");
  }

  if (createdBy.branchId !== input.branchId) {
    throw new Error("Staff can only create intake forms for their own branch.");
  }

  const token = await generateUniqueToken();
  const publicUrl = `/forms/${token}`;

  return prisma.intakeFormRequest.create({
    data: {
      branchId: input.branchId,
      createdById: input.createdById,
      title,
      description: normalizeNullableString(input.description),
      token,
      status: IntakeFormRequestStatus.draft,
      publicUrl,
      qrCodeValue: publicUrl,
      expiresAt: toDateOrNull(input.expiresAt),
      notes: normalizeNullableString(input.notes),
    },
    include: {
      branch: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      submissions: true,
    },
  });
}

export async function getIntakeFormRequestById(id: string) {
  const request = await prisma.intakeFormRequest.findUnique({
    where: { id },
    include: {
      branch: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
          role: {
            select: { name: true },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
          role: {
            select: { name: true },
          },
        },
      },
      submissions: {
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!request) {
    throw new Error("Intake form request not found.");
  }

  return request;
}

export async function getIntakeFormRequestByToken(token: string) {
  const request = await prisma.intakeFormRequest.findUnique({
    where: { token },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          isActive: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Intake form request not found.");
  }

  return request;
}

export async function listIntakeFormRequestsByBranch(branchId: string) {
  return prisma.intakeFormRequest.findMany({
    where: { branchId },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function updateIntakeFormRequest(
  id: string,
  data: UpdateIntakeFormRequestInput
) {
  const existing = await prisma.intakeFormRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new Error("Intake form request not found.");
  }

  const nextStatus = data.status ?? existing.status;

  let sharedAt: Date | undefined | null = undefined;
  let closedAt: Date | undefined | null = undefined;

  if (
    nextStatus === IntakeFormRequestStatus.shared &&
    existing.status !== IntakeFormRequestStatus.shared
  ) {
    sharedAt = new Date();
  }

  if (nextStatus === IntakeFormRequestStatus.closed) {
    closedAt = new Date();
  } else if (data.status && data.status !== IntakeFormRequestStatus.closed) {
    closedAt = null;
  }

  return prisma.intakeFormRequest.update({
    where: { id },
    data: {
      title: data.title?.trim() || undefined,
      description: normalizeNullableString(data.description),
      status: data.status,
      sharedAt,
      closedAt,
      expiresAt: toDateOrNull(data.expiresAt),
      notes: normalizeNullableString(data.notes),
    },
    include: {
      branch: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function assignIntakeFormRequest(
  input: AssignIntakeFormRequestInput
) {
  const [request, actingUser, assignedTo] = await Promise.all([
    prisma.intakeFormRequest.findUnique({
      where: { id: input.requestId },
      select: {
        id: true,
        branchId: true,
        status: true,
      },
    }),
    getActiveUserWithBranch(input.actingUserId),
    getActiveAssignableUser(input.assignedToId),
  ]);

  if (!request) {
    throw new Error("Intake form request not found.");
  }

  if (actingUser.branchId !== request.branchId) {
    throw new Error("You can only assign intake requests inside your own branch.");
  }

  if (assignedTo.branchId !== request.branchId) {
    throw new Error("Assigned staff must belong to the same branch.");
  }

  const nextStatus =
    request.status === IntakeFormRequestStatus.submitted ||
    request.status === IntakeFormRequestStatus.shared
      ? IntakeFormRequestStatus.assigned
      : request.status;

  return prisma.intakeFormRequest.update({
    where: { id: input.requestId },
    data: {
      assignedToId: input.assignedToId,
      status: nextStatus,
    },
    include: {
      branch: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
    },
  });
}

export async function submitIntakeFormByToken(
  token: string,
  input: SubmitIntakeFormInput
) {
  const request = await prisma.intakeFormRequest.findUnique({
    where: { token },
    select: {
      id: true,
      branchId: true,
      status: true,
      expiresAt: true,
      assignedToId: true,
    },
  });

  if (!request) {
    throw new Error("Intake form request not found.");
  }

  if (request.status === IntakeFormRequestStatus.closed) {
    throw new Error("This intake form is closed.");
  }

  if (request.expiresAt && request.expiresAt.getTime() < Date.now()) {
    throw new Error("This intake form has expired.");
  }

  const firstName = requireNonEmptyString(input.firstName, "First name");
  const lastName = requireNonEmptyString(input.lastName, "Last name");
  const phone = requireNonEmptyString(input.phone, "Phone");

  return prisma.$transaction(async (tx) => {
    const submission = await tx.intakeFormSubmission.create({
      data: {
        intakeFormRequestId: request.id,
        branchId: request.branchId,
        assignedToId: request.assignedToId ?? null,
        firstName,
        lastName,
        email: normalizeNullableString(input.email),
        phone,
        country: normalizeNullableString(input.country),
        city: normalizeNullableString(input.city),
        address: normalizeNullableString(input.address),
        nationality: normalizeNullableString(input.nationality),
        dateOfBirth: toDateOrNull(input.dateOfBirth) ?? null,
        interestedCountry: normalizeNullableString(input.interestedCountry),
        interestedCourse: normalizeNullableString(input.interestedCourse),
        studyLevel: normalizeNullableString(input.studyLevel),
        preferredIntake: normalizeNullableString(input.preferredIntake),
        preferredYear: input.preferredYear ?? null,
        englishTestStatus: normalizeNullableString(input.englishTestStatus),
        englishTestScore: normalizeNullableString(input.englishTestScore),
        passportStatus: normalizeNullableString(input.passportStatus),
        passportNumber: normalizeNullableString(input.passportNumber),
        educationLevel: normalizeNullableString(input.educationLevel),
        workExperience: normalizeNullableString(input.workExperience),
        budget: normalizeNullableString(input.budget),
        fundingSource: normalizeNullableString(input.fundingSource),
        notes: normalizeNullableString(input.notes),
        status: request.assignedToId
          ? IntakeFormSubmissionStatus.assigned
          : IntakeFormSubmissionStatus.pending_review,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await tx.intakeFormRequest.update({
      where: { id: request.id },
      data: {
        status: request.assignedToId
          ? IntakeFormRequestStatus.assigned
          : IntakeFormRequestStatus.submitted,
        submittedAt: new Date(),
      },
    });

    return submission;
  });
}

export async function listIntakeSubmissionsByBranch(branchId: string) {
  return prisma.intakeFormSubmission.findMany({
    where: { branchId },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          title: true,
          token: true,
          status: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [{ submittedAt: "desc" }],
  });
}

export async function getIntakeSubmissionById(submissionId: string) {
  const submission = await prisma.intakeFormSubmission.findUnique({
    where: { id: submissionId },
    include: {
      intakeFormRequest: {
        include: {
          branch: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Intake submission not found.");
  }

  return submission;
}

export async function assignIntakeSubmission(
  input: AssignIntakeSubmissionInput
) {
  const [submission, actingUser, assignedTo] = await Promise.all([
    prisma.intakeFormSubmission.findUnique({
      where: { id: input.submissionId },
      select: {
        id: true,
        branchId: true,
      },
    }),
    getActiveUserWithBranch(input.actingUserId),
    getActiveAssignableUser(input.assignedToId),
  ]);

  if (!submission) {
    throw new Error("Intake submission not found.");
  }

  if (actingUser.branchId !== submission.branchId) {
    throw new Error("You can only assign submissions inside your own branch.");
  }

  if (assignedTo.branchId !== submission.branchId) {
    throw new Error("Assigned staff must belong to the same branch.");
  }

  return prisma.intakeFormSubmission.update({
    where: { id: input.submissionId },
    data: {
      assignedToId: input.assignedToId,
      status: IntakeFormSubmissionStatus.assigned,
    },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          title: true,
          token: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function reviewIntakeSubmission(
  input: ReviewIntakeSubmissionInput
) {
  const [submission, reviewer] = await Promise.all([
    prisma.intakeFormSubmission.findUnique({
      where: { id: input.submissionId },
      select: {
        id: true,
        branchId: true,
        status: true,
      },
    }),
    getActiveUserWithBranch(input.reviewedById),
  ]);

  if (!submission) {
    throw new Error("Intake submission not found.");
  }

  if (reviewer.branchId !== submission.branchId) {
    throw new Error("You can only review submissions inside your own branch.");
  }

  const nextStatus = input.status ?? IntakeFormSubmissionStatus.reviewed;

  let reviewedAt: Date | null | undefined = undefined;
  let closedAt: Date | null | undefined = undefined;

  if (
    nextStatus === IntakeFormSubmissionStatus.reviewed ||
    nextStatus === IntakeFormSubmissionStatus.converted ||
    nextStatus === IntakeFormSubmissionStatus.closed
  ) {
    reviewedAt = new Date();
  }

  if (nextStatus === IntakeFormSubmissionStatus.closed) {
    closedAt = new Date();
  } else {
    closedAt = null;
  }

  return prisma.intakeFormSubmission.update({
    where: { id: input.submissionId },
    data: {
      reviewedById: input.reviewedById,
      reviewedAt,
      closedAt,
      status: nextStatus,
      internalNotes: normalizeNullableString(input.internalNotes),
    },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          title: true,
          token: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function convertIntakeSubmissionToClient(
  input: ConvertIntakeSubmissionToClientInput
) {
  const actingUser = await getActiveUserWithBranch(input.actingUserId);

  const submission = await prisma.intakeFormSubmission.findUnique({
    where: { id: input.submissionId },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          status: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Intake submission not found.");
  }

  if (actingUser.branchId !== submission.branchId) {
    throw new Error("You can only convert submissions inside your own branch.");
  }

  if (submission.clientId) {
    throw new Error("This intake submission has already been converted.");
  }

  let sourceId = input.sourceId ?? null;

  if (!sourceId) {
    const intakeSource = await prisma.leadSource.findUnique({
      where: { name: "Intake Form" },
      select: { id: true },
    });

    sourceId = intakeSource?.id ?? null;
  }

  const createdClient = await prisma.$transaction(async (tx) => {
    let existingClient = null;

    if (submission.email) {
      existingClient = await tx.client.findFirst({
        where: {
          branchId: submission.branchId,
          email: submission.email,
        },
        select: {
          id: true,
        },
      });
    }

    if (!existingClient) {
      existingClient = await tx.client.findFirst({
        where: {
          branchId: submission.branchId,
          phone: submission.phone,
        },
        select: {
          id: true,
        },
      });
    }

    if (existingClient) {
      throw new Error(
        "A client with the same email or phone already exists in this branch."
      );
    }

    const client = await tx.client.create({
      data: {
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: normalizeNullableString(submission.email),
        phone: submission.phone,
        passport: normalizeNullableString(submission.passportNumber),
        branchId: submission.branchId,
        sourceId,
        workflowId: input.workflowId ?? null,
        currentStageId: input.currentStageId ?? null,
        subagentId: input.subagentId ?? null,
      },
    });

    await tx.intakeFormSubmission.update({
      where: { id: submission.id },
      data: {
        clientId: client.id,
        status: IntakeFormSubmissionStatus.converted,
        convertedAt: new Date(),
        reviewedById: input.actingUserId,
        reviewedAt: submission.reviewedAt ?? new Date(),
      },
    });

    await tx.intakeFormRequest.update({
      where: { id: submission.intakeFormRequestId },
      data: {
        status: IntakeFormRequestStatus.converted,
        convertedAt: new Date(),
      },
    });

    await tx.clientActivity.create({
      data: {
        clientId: client.id,
        type: "intake_conversion",
        message: `Client created from intake submission for ${submission.firstName} ${submission.lastName}.`,
      },
    });

    if (submission.notes) {
      await tx.clientNote.create({
        data: {
          clientId: client.id,
          content: `Intake submission notes: ${submission.notes}`,
        },
      });
    }

    return client;
  });

  return prisma.client.findUnique({
    where: { id: createdClient.id },
    include: {
      branch: true,
      source: true,
      workflow: true,
      currentStage: true,
      subagent: true,
      activities: {
        orderBy: { createdAt: "desc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function markIntakeFormRequestShared(id: string) {
  return updateIntakeFormRequest(id, {
    status: IntakeFormRequestStatus.shared,
  });
}

export async function closeIntakeFormRequest(id: string) {
  return updateIntakeFormRequest(id, {
    status: IntakeFormRequestStatus.closed,
  });
}

export async function getAssignableUsersByBranch(branchId: string) {
  return prisma.user.findMany({
    where: {
      branchId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      branchId: true,
      role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}