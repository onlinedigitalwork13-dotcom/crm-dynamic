import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import ConvertIntakeSubmissionClient from "@/app/(protected)/intake-submissions/[id]/convert/convert-intake-submission-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeText(value?: string | null) {
  return (value || "").trim();
}

export default async function LeadConvertPage({ params }: PageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
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
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      intakeSubmission: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          passportNumber: true,
          notes: true,
          status: true,
          branchId: true,
          submissionMeta: true,
          createdAt: true,
          country: true,
          city: true,
          address: true,
          nationality: true,
          dateOfBirth: true,
          internalNotes: true,
          answers: true,
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
          intakeFormRequest: {
            select: {
              id: true,
              title: true,
              token: true,
            },
          },
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          referralCode: true,
        },
      },
      clientCheckIn: {
        select: {
          id: true,
          checkInMethod: true,
          visitReason: true,
          notes: true,
          checkedInAt: true,
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  if (lead.clientId) {
    redirect(`/clients/${lead.clientId}`);
  }

  const isAdmin =
    session.user.roleName === "super_admin" ||
    session.user.roleName === "admin";

  if (!isAdmin) {
    if (!session.user.branchId) {
      redirect("/dashboard");
    }

    if (lead.branchId && lead.branchId !== session.user.branchId) {
      redirect("/leads");
    }
  }

  if (!lead.intakeSubmissionId || !lead.intakeSubmission) {
    redirect("/leads");
  }

  const submission = lead.intakeSubmission;

  const firstName = normalizeText(submission.firstName || lead.firstName);
  const lastName = normalizeText(submission.lastName || lead.lastName);
  const email = normalizeText(submission.email || lead.email);
  const phone = normalizeText(submission.phone || lead.phone);
  const passport = normalizeText(
    submission.passportNumber || lead.passportNumber
  );

  const duplicateWhereOr: Array<{
    email?: { equals: string; mode: "insensitive" };
    phone?: string;
    passport?: { equals: string; mode: "insensitive" };
  }> = [];

  if (email) {
    duplicateWhereOr.push({
      email: {
        equals: email,
        mode: "insensitive",
      },
    });
  }

  if (phone) {
    duplicateWhereOr.push({
      phone,
    });
  }

  if (passport) {
    duplicateWhereOr.push({
      passport: {
        equals: passport,
        mode: "insensitive",
      },
    });
  }

  const [
    branches,
    leadSources,
    workflows,
    workflowStages,
    subagents,
    duplicateCandidates,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),

    prisma.leadSource.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.workflow.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.workflowStage.findMany({
      orderBy: {
        orderSequence: "asc",
      },
      select: {
        id: true,
        stageName: true,
        workflowId: true,
        orderSequence: true,
      },
    }),

    prisma.subagent.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    duplicateWhereOr.length > 0
      ? prisma.client.findMany({
          where: {
            OR: duplicateWhereOr,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            passport: true,
            branchId: true,
            createdAt: true,
            updatedAt: true,
            subagentId: true,
          },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const duplicateCandidatesWithReasons = duplicateCandidates
    .map((client) => {
      const reasons: string[] = [];

      if (
        email &&
        client.email &&
        client.email.trim().toLowerCase() === email.toLowerCase()
      ) {
        reasons.push("Email match");
      }

      if (phone && client.phone && client.phone.trim() === phone) {
        reasons.push("Phone match");
      }

      if (
        passport &&
        client.passport &&
        client.passport.trim().toLowerCase() === passport.toLowerCase()
      ) {
        reasons.push("Passport match");
      }

      const nameMatch = Boolean(
        firstName &&
          lastName &&
          client.firstName?.trim().toLowerCase() === firstName.toLowerCase() &&
          client.lastName?.trim().toLowerCase() === lastName.toLowerCase()
      );

      return {
        ...client,
        reasons,
        matchScore: reasons.length * 100 + (nameMatch ? 25 : 0),
        nameMatch,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <ConvertIntakeSubmissionClient
      submissionId={submission.id}
      defaultValues={{
        firstName: submission.firstName || lead.firstName || "",
        lastName: submission.lastName || lead.lastName || "",
        email: submission.email || lead.email || "",
        phone: submission.phone || lead.phone || "",
        passport: submission.passportNumber || lead.passportNumber || "",
        notes: submission.notes || lead.notes || "",
        branchId: submission.branchId || lead.branchId || "",
      }}
      branches={branches}
      leadSources={leadSources}
      workflows={workflows}
      workflowStages={workflowStages.map((stage) => ({
        id: stage.id,
        name: stage.stageName,
        workflowId: stage.workflowId,
        orderIndex: stage.orderSequence,
      }))}
      subagents={subagents}
      submissionMeta={submission.submissionMeta}
      duplicateCandidates={duplicateCandidatesWithReasons}
      mode="lead"
    />
  );
}