import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    await requireAuth();

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        status: true,
        notes: true,
        source: true,
        createdAt: true,

        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            passport: true,
          },
        },

        agent: {
          select: {
            id: true,
            name: true,
            referralCode: true,
            email: true,
            phone: true,
          },
        },

        intakeSubmission: {
          select: {
            id: true,
            status: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
            passportNumber: true,
            notes: true,
            submittedAt: true,
            submissionMeta: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const submissionMeta = safeObject(lead.intakeSubmission?.submissionMeta);
    const subagentMeta = safeObject(submissionMeta.subagent);
    const applicationInterest = safeObject(submissionMeta.applicationInterest);

    const providerId = safeString(applicationInterest.providerId);
    const providerName = safeString(applicationInterest.providerName);
    const courseId = safeString(applicationInterest.courseId);
    const courseName = safeString(applicationInterest.courseName);
    const intake = safeString(applicationInterest.intake);
    const studyLevel = safeString(applicationInterest.studyLevel);
    const preferredCampus = safeString(applicationInterest.preferredCampus);
    const subjectArea = safeString(applicationInterest.subjectArea);
    const duration = safeString(applicationInterest.duration);
    const destinationCountry = safeString(
      applicationInterest.destinationCountry
    );

    return NextResponse.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          country: lead.country,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          createdAt: lead.createdAt,
        },

        client: lead.client
          ? {
              id: lead.client.id,
              firstName: lead.client.firstName,
              lastName: lead.client.lastName,
              email: lead.client.email,
              phone: lead.client.phone,
              passport: lead.client.passport,
            }
          : null,

        intakeSubmission: lead.intakeSubmission
          ? {
              id: lead.intakeSubmission.id,
              status: lead.intakeSubmission.status,
              submittedAt: lead.intakeSubmission.submittedAt,
              firstName: lead.intakeSubmission.firstName,
              lastName: lead.intakeSubmission.lastName,
              email: lead.intakeSubmission.email,
              phone: lead.intakeSubmission.phone,
              country: lead.intakeSubmission.country,
              passportNumber: lead.intakeSubmission.passportNumber,
              notes: lead.intakeSubmission.notes,
            }
          : null,

        subagent: {
          id: lead.agent?.id ?? null,
          name: lead.agent?.name || safeString(subagentMeta.name),
          referralCode:
            lead.agent?.referralCode || safeString(subagentMeta.reference),
          email: lead.agent?.email || safeString(subagentMeta.email),
          phone: lead.agent?.phone || safeString(subagentMeta.phone),
          agencyName: safeString(subagentMeta.agencyName),
        },

        applicationPrefill: {
          providerId,
          providerName,
          courseId,
          courseName,
          intake,
          studyLevel,
          preferredCampus,
          subjectArea,
          duration,
          destinationCountry,
          notes: [
            safeString(lead.notes),
            safeString(lead.intakeSubmission?.notes),
          ]
            .filter(Boolean)
            .join("\n\n"),
        },

        canCreateApplication: Boolean(lead.client?.id),
        blockingReason: lead.client?.id
          ? null
          : "This lead is not linked to a client yet. Convert or link the student first, then create the application.",
      },
    });
  } catch (error) {
    console.error("GET /api/leads/[id]/prefill error:", error);

    return NextResponse.json(
      { error: "Failed to load lead prefill data" },
      { status: 500 }
    );
  }
}