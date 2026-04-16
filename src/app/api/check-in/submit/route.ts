import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapFormValuesToClient } from "@/lib/clients/map-form-values-to-client";
import { createNotification } from "@/lib/notification-service";

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(value: unknown) {
  const email = normalizeString(value);
  return email ? email.toLowerCase() : null;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type CreateSubmissionInput = {
  branchId: string;
  intakeFormRequestId?: string | null;
  token?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  notes?: string | null;
  visitReason?: string | null;
  dateOfBirth?: Date | null;
};

type DbClient = Prisma.TransactionClient | PrismaClient;

type CheckInResult =
  | {
      success: true;
      mode: "existing_client";
      allowFormFill: false;
      message: string;
      client: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        passport: string | null;
        branchId: string | null;
      };
      checkIn: {
        id: string;
        checkedInAt: Date;
        branchId: string | null;
        clientId: string | null;
        intakeSubmissionId: string | null;
      };
      previousCheckInCount: number;
    }
  | {
      success: true;
      mode: "historical_intake_match";
      allowFormFill: true;
      message: string;
      intakeSubmission: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        passportNumber: string | null;
        branchId: string | null;
        clientId: string | null;
        assignedToId: string | null;
      };
      lead: {
        id: string;
        branchId: string | null;
        intakeSubmissionId: string | null;
        clientId: string | null;
        clientCheckInId: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        passportNumber: string | null;
        source: string | null;
        lastActivityAt: Date | null;
      };
      checkIn: {
        id: string;
        checkedInAt: Date;
        branchId: string | null;
        clientId: string | null;
        intakeSubmissionId: string | null;
      };
      previousCheckInCount: number;
    }
  | {
      success: true;
      mode: "new_submission";
      allowFormFill: true;
      message: string;
      submission: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        branchId: string | null;
        passportNumber: string | null;
        answers: Prisma.JsonValue;
        assignedToId: string | null;
      };
      checkIn: {
        id: string;
        checkedInAt: Date;
        branchId: string | null;
        clientId: string | null;
        intakeSubmissionId: string | null;
      };
      previousCheckInCount: number;
    };

async function findExistingPerson(params: {
  tx: DbClient;
  phone?: string | null;
  email?: string | null;
  passportNumber?: string | null;
}) {
  const { tx, phone, email, passportNumber } = params;

  const identifiers = [
    phone ? { phone } : undefined,
    email ? { email } : undefined,
    passportNumber ? { passport: passportNumber } : undefined,
  ].filter(Boolean) as Prisma.ClientWhereInput[];

  if (identifiers.length > 0) {
    const client = await tx.client.findFirst({
      where: {
        OR: identifiers,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passport: true,
        branchId: true,
      },
    });

    if (client) {
      return {
        type: "client" as const,
        client,
      };
    }
  }

  const intakeIdentifiers = [
    phone ? { phone } : undefined,
    email ? { email } : undefined,
    passportNumber ? { passportNumber } : undefined,
  ].filter(Boolean) as Prisma.IntakeFormSubmissionWhereInput[];

  if (intakeIdentifiers.length > 0) {
    const intakeSubmission = await tx.intakeFormSubmission.findFirst({
      where: {
        OR: intakeIdentifiers,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passportNumber: true,
        branchId: true,
        clientId: true,
        assignedToId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (intakeSubmission) {
      return {
        type: "intake_submission" as const,
        intakeSubmission,
      };
    }
  }

  return {
    type: "new" as const,
  };
}

async function upsertLead(
  tx: Prisma.TransactionClient,
  data: {
    branchId: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    passportNumber?: string | null;
    intakeSubmissionId?: string | null;
    clientId?: string | null;
    clientCheckInId?: string | null;
    source: string;
  }
) {
  let existingLead = null;

  if (data.intakeSubmissionId) {
    existingLead = await tx.lead.findUnique({
      where: { intakeSubmissionId: data.intakeSubmissionId },
    });
  }

  if (!existingLead && data.clientCheckInId) {
    existingLead = await tx.lead.findFirst({
      where: { clientCheckInId: data.clientCheckInId },
    });
  }

  if (existingLead) {
    const updatedLead = await tx.lead.update({
      where: { id: existingLead.id },
      data: {
        clientId: data.clientId ?? undefined,
        clientCheckInId: data.clientCheckInId ?? undefined,
        lastActivityAt: new Date(),
      },
      select: {
        id: true,
        branchId: true,
        intakeSubmissionId: true,
        clientId: true,
        clientCheckInId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passportNumber: true,
        source: true,
        lastActivityAt: true,
      },
    });

    if (data.intakeSubmissionId) {
      await tx.intakeFormSubmission.update({
        where: { id: data.intakeSubmissionId },
        data: {
          lead: {
            connect: { id: updatedLead.id },
          },
        },
      });
    }

    return updatedLead;
  }

  const lead = await tx.lead.create({
    data: {
      branchId: data.branchId,
      intakeSubmissionId: data.intakeSubmissionId ?? null,
      clientId: data.clientId ?? null,
      clientCheckInId: data.clientCheckInId ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      passportNumber: data.passportNumber ?? null,
      source: data.source,
      lastActivityAt: new Date(),
    },
    select: {
      id: true,
      branchId: true,
      intakeSubmissionId: true,
      clientId: true,
      clientCheckInId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passportNumber: true,
      source: true,
      lastActivityAt: true,
    },
  });

  if (data.intakeSubmissionId) {
    await tx.intakeFormSubmission.update({
      where: { id: data.intakeSubmissionId },
      data: {
        lead: {
          connect: { id: lead.id },
        },
      },
    });
  }

  return lead;
}

async function createSubmissionAndCheckIn(
  tx: Prisma.TransactionClient,
  input: CreateSubmissionInput
) {
  const answers: Prisma.InputJsonObject = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email ?? null,
    phone: input.phone,
    country: input.country ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    nationality: input.nationality ?? null,
    passportNumber: input.passportNumber ?? null,
    notes: input.notes ?? null,
    visitReason: input.visitReason ?? null,
  };

  const submissionMeta: Prisma.InputJsonObject = {
    submittedFrom: "check_in_submit_api",
    submittedAtIso: new Date().toISOString(),
    sourceToken: input.token ?? null,
    mode: "new_check_in",
  };

  if (!input.intakeFormRequestId) {
    throw new Error("intakeFormRequestId is required to create an intake submission");
  }

  const formRequest = await tx.intakeFormRequest.findUnique({
    where: { id: input.intakeFormRequestId },
    select: {
      id: true,
      createdById: true,
      assignedToId: true,
    },
  });

  const submission = await tx.intakeFormSubmission.create({
    data: {
      intakeFormRequestId: input.intakeFormRequestId,
      branchId: input.branchId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? null,
      phone: input.phone,
      country: input.country ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      nationality: input.nationality ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      passportNumber: input.passportNumber ?? null,
      notes: input.notes ?? null,
      answers,
      submissionMeta,
      status: "new",
      assignedToId: formRequest?.assignedToId ?? null,
      assignedAt: formRequest?.assignedToId ? new Date() : null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      branchId: true,
      passportNumber: true,
      answers: true,
      assignedToId: true,
    },
  });

  const mapped = mapFormValuesToClient({
    values: {
      firstName: submission.firstName ?? "",
      lastName: submission.lastName ?? "",
      email: submission.email ?? "",
      phone: submission.phone ?? "",
      passportNumber: submission.passportNumber ?? "",
      ...(submission.answers as Record<string, string>),
    },
    branchId: submission.branchId,
  });

  const client = await tx.client.create({
    data: {
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      email: mapped.email ?? null,
      phone: mapped.phone,
      passport: mapped.passport ?? null,
      branchId: mapped.branchId ?? null,
      profileData: mapped.profileData as Prisma.InputJsonValue,
      createdById: formRequest?.createdById ?? null,
      assignedToId: submission.assignedToId ?? formRequest?.assignedToId ?? null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      branchId: true,
    },
  });

  await tx.intakeFormSubmission.update({
    where: { id: submission.id },
    data: {
      clientId: client.id,
    },
  });

  const checkIn = await tx.clientCheckIn.create({
    data: {
      clientId: client.id,
      intakeSubmissionId: submission.id,
      branchId: input.branchId,
      checkInMethod: "qr",
      visitReason: input.visitReason ?? null,
      notes: input.notes ?? null,
    },
    select: {
      id: true,
      checkedInAt: true,
      branchId: true,
      intakeSubmissionId: true,
      clientId: true,
    },
  });

  await upsertLead(tx, {
    branchId: input.branchId,
    intakeSubmissionId: submission.id,
    clientId: client.id,
    clientCheckInId: checkIn.id,
    firstName: submission.firstName,
    lastName: submission.lastName,
    email: submission.email,
    phone: submission.phone,
    passportNumber: submission.passportNumber,
    source: "check_in_new",
  });

  return { submission, client, checkIn };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const branchId = normalizeString(body.branchId);
    const intakeFormRequestId = normalizeString(body.intakeFormRequestId);
    const token = normalizeString(body.token);

    const firstName = normalizeString(body.firstName);
    const lastName = normalizeString(body.lastName);
    const email = normalizeEmail(body.email);
    const phone = normalizeString(body.phone);
    const country = normalizeString(body.country);
    const city = normalizeString(body.city);
    const address = normalizeString(body.address);
    const nationality = normalizeString(body.nationality);
    const passportNumber = normalizeString(body.passportNumber);
    const notes = normalizeString(body.notes);
    const visitReason = normalizeString(body.visitReason);
    const dateOfBirth = normalizeDate(body.dateOfBirth);

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 }
      );
    }

    if (!phone && !email && !passportNumber) {
      return NextResponse.json(
        { error: "Phone, email, or passport number is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx): Promise<CheckInResult> => {
        const existing = await findExistingPerson({
          tx,
          phone,
          email,
          passportNumber,
        });

        if (existing.type === "client") {
          const checkIn = await tx.clientCheckIn.create({
            data: {
              clientId: existing.client.id,
              branchId,
              checkInMethod: "qr",
              visitReason: visitReason ?? null,
              notes: notes ?? null,
            },
            select: {
              id: true,
              checkedInAt: true,
              branchId: true,
              clientId: true,
              intakeSubmissionId: true,
            },
          });

          await upsertLead(tx, {
            branchId,
            clientId: existing.client.id,
            clientCheckInId: checkIn.id,
            firstName: existing.client.firstName,
            lastName: existing.client.lastName,
            email: existing.client.email,
            phone: existing.client.phone,
            passportNumber: existing.client.passport,
            source: "existing_client",
          });

          const previousCheckInCount = await tx.clientCheckIn.count({
            where: {
              clientId: existing.client.id,
            },
          });

          return {
            success: true,
            mode: "existing_client",
            allowFormFill: false,
            message:
              "Existing client found. Form entry is locked and check-in has been completed.",
            client: existing.client,
            checkIn,
            previousCheckInCount,
          };
        }

        if (existing.type === "intake_submission") {
          const intake = existing.intakeSubmission;

          const checkIn = await tx.clientCheckIn.create({
            data: {
              intakeSubmissionId: intake.id,
              branchId,
              checkInMethod: "qr",
              visitReason: visitReason ?? null,
              notes: notes ?? null,
            },
            select: {
              id: true,
              checkedInAt: true,
              branchId: true,
              clientId: true,
              intakeSubmissionId: true,
            },
          });

          const lead = await upsertLead(tx, {
            branchId,
            intakeSubmissionId: intake.id,
            clientId: intake.clientId ?? null,
            clientCheckInId: checkIn.id,
            firstName: intake.firstName,
            lastName: intake.lastName,
            email: intake.email,
            phone: intake.phone,
            passportNumber: intake.passportNumber,
            source: "check_in_from_intake",
          });

          const previousCheckInCount = await tx.clientCheckIn.count({
            where: { intakeSubmissionId: intake.id },
          });

          return {
            success: true,
            mode: "historical_intake_match",
            allowFormFill: true,
            message:
              "Previous intake found. Lead has been created/updated and routed into live queue.",
            intakeSubmission: intake,
            lead,
            checkIn,
            previousCheckInCount,
          };
        }

        if (!firstName || !lastName || !phone) {
          throw new Error(
            "First name, last name, and phone are required for a new student check-in"
          );
        }

        const created = await createSubmissionAndCheckIn(tx, {
          branchId,
          intakeFormRequestId,
          token,
          firstName,
          lastName,
          email,
          phone,
          country,
          city,
          address,
          nationality,
          passportNumber,
          notes,
          visitReason,
          dateOfBirth,
        });

        return {
          success: true,
          mode: "new_submission",
          allowFormFill: true,
          message: "New intake submission, client, and check-in created successfully.",
          submission: created.submission,
          checkIn: created.checkIn,
          previousCheckInCount: 1,
        };
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    // Send in-app notification after successful DB transaction.
    // Notification failure must never break successful check-in.
    try {
      let userId: string | null = null;
      let title = "New Check-In";
      let message = "A check-in has been completed";
      let link: string | null = null;

      if (result.mode === "existing_client") {
        userId = null;
        title = "Existing Client Check-In";
        message = `${result.client.firstName ?? ""} ${result.client.lastName ?? ""} checked in`.trim();
        link = `/clients/${result.client.id}`;
      }

      if (result.mode === "historical_intake_match") {
        userId = result.intakeSubmission.assignedToId;
        title = "Lead Activity Updated";
        message = `${result.intakeSubmission.firstName ?? ""} ${result.intakeSubmission.lastName ?? ""} checked in (from intake)`.trim();
        link = `/leads/${result.lead.id}`;
      }

      if (result.mode === "new_submission") {
        userId = result.submission.assignedToId;
        title = "New Lead Created";
        message = `${result.submission.firstName ?? ""} ${result.submission.lastName ?? ""} submitted check-in`.trim();
        link = `/leads`;
      }

      if (userId) {
        await createNotification({
          userId,
          title,
          message,
          type: "check_in",
          link,
        });
      }
    } catch (notificationError) {
      console.error("Check-in notification error:", notificationError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/check-in/submit error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit check-in",
      },
      { status: 500 }
    );
  }
}