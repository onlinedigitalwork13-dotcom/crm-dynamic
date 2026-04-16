import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConvertIntakeSubmissionClient from "./convert-intake-submission-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function normalizeText(value?: string | null) {
  return (value || "").trim();
}

export default async function ConvertIntakeSubmissionPage({
  params,
}: PageProps) {
  const { id } = await params;

  const submission = await prisma.intakeFormSubmission.findUnique({
    where: { id },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          title: true,
          token: true,
        },
      },
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
        },
      },
      lead: {
        select: {
          id: true,
          clientId: true,
          status: true,
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  if (submission.clientId) {
    redirect(`/clients/${submission.clientId}`);
  }

  const firstName = normalizeText(submission.firstName);
  const lastName = normalizeText(submission.lastName);
  const email = normalizeText(submission.email);
  const phone = normalizeText(submission.phone);
  const passport = normalizeText(submission.passportNumber);

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

  const duplicateCandidatesWithReasons = duplicateCandidates.map((client) => {
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
  });

  const sortedDuplicateCandidates = duplicateCandidatesWithReasons.sort(
    (a, b) => b.matchScore - a.matchScore
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Intake Conversion</p>
            <h1 className="text-2xl font-bold text-gray-900">
              Convert Submission to Client
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Review the intake submission and convert it into a client record.
            </p>
          </div>

          <Link
            href="/intake-submissions"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Back to Queue
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Submission Summary
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {formatName(submission.firstName, submission.lastName)}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {submission.email || "—"}
            </p>
            <p>
              <span className="font-medium">Phone:</span>{" "}
              {submission.phone || "—"}
            </p>
            <p>
              <span className="font-medium">Passport:</span>{" "}
              {submission.passportNumber || "—"}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Branch:</span>{" "}
              {submission.branch?.name || "—"}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              {submission.status || "—"}
            </p>
            <p>
              <span className="font-medium">Submitted:</span>{" "}
              {formatDate(submission.createdAt)}
            </p>
            <p>
              <span className="font-medium">Assigned To:</span>{" "}
              {submission.assignedTo
                ? formatName(
                    submission.assignedTo.firstName,
                    submission.assignedTo.lastName
                  )
                : "—"}
            </p>
            <p>
              <span className="font-medium">Reviewed By:</span>{" "}
              {submission.reviewedBy
                ? formatName(
                    submission.reviewedBy.firstName,
                    submission.reviewedBy.lastName
                  )
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <ConvertIntakeSubmissionClient
        submissionId={submission.id}
        defaultValues={{
          firstName: submission.firstName || "",
          lastName: submission.lastName || "",
          email: submission.email || "",
          phone: submission.phone || "",
          passport: submission.passportNumber || "",
          notes: submission.notes || "",
          branchId: submission.branchId || "",
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
        duplicateCandidates={sortedDuplicateCandidates}
      />
    </div>
  );
}