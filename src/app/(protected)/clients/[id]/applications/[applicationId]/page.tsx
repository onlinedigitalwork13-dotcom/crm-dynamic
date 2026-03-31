import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
    applicationId: string;
  }>;
};

function statusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("approved") || normalized.includes("granted")) {
    return "bg-green-100 text-green-800";
  }

  if (normalized.includes("offer") || normalized.includes("submitted")) {
    return "bg-blue-100 text-blue-800";
  }

  if (normalized.includes("pending") || normalized.includes("applied")) {
    return "bg-yellow-100 text-yellow-800";
  }

  if (normalized.includes("rejected") || normalized.includes("refused")) {
    return "bg-red-100 text-red-800";
  }

  return "bg-gray-100 text-gray-700";
}

export default async function ClientApplicationDetailPage({
  params,
}: PageProps) {
  const { id, applicationId } = await params;

  const application = await prisma.clientApplication.findFirst({
    where: {
      id: applicationId,
      clientId: id,
    },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
      checklistItems: {
        include: {
          documents: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const totalChecklistItems = application.checklistItems.length;
  const verifiedChecklistItems = application.checklistItems.filter(
    (item) => item.status === "verified"
  ).length;
  const receivedChecklistItems = application.checklistItems.filter(
    (item) => item.status === "received" || item.status === "verified"
  ).length;
  const checklistCompletion =
    totalChecklistItems === 0
      ? 0
      : Math.round((verifiedChecklistItems / totalChecklistItems) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2">
            <Link
              href={`/clients/${id}/applications`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Applications
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Application Detail
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            View application progress, journey, and checklist.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/clients/${id}/applications/${applicationId}/edit`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Application
          </Link>

          <Link
            href={`/clients/${id}/applications/${applicationId}/checklist`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Checklist
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Application Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem
              label="Client"
              value={`${application.client.firstName} ${application.client.lastName}`}
            />
            <InfoItem label="Provider" value={application.provider.name} />
            <InfoItem label="Course" value={application.course.name} />
            <InfoItem
              label="Intake"
              value={`${application.intake}${application.intakeYear ? ` ${application.intakeYear}` : ""}`}
            />
            <InfoItem
              label="Application No"
              value={application.applicationNo || "—"}
            />
            <div>
              <div className="text-sm font-medium text-gray-500">Status</div>
              <div className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(
                    application.status
                  )}`}
                >
                  {application.status}
                </span>
              </div>
            </div>
            <InfoItem
              label="Applied At"
              value={
                application.appliedAt
                  ? new Date(application.appliedAt).toLocaleDateString()
                  : "—"
              }
            />
            <InfoItem
              label="Offer Date"
              value={
                application.offerDate
                  ? new Date(application.offerDate).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-gray-500">Notes</div>
            <div className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              {application.notes || "No notes added."}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Checklist Overview
          </h2>

          <div className="mt-4 space-y-3">
            <OverviewItem
              label="Total Items"
              value={String(totalChecklistItems)}
            />
            <OverviewItem
              label="Received"
              value={String(receivedChecklistItems)}
            />
            <OverviewItem
              label="Verified"
              value={String(verifiedChecklistItems)}
            />
            <OverviewItem
              label="Completion"
              value={`${checklistCompletion}%`}
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="text-gray-600">{checklistCompletion}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all"
                style={{ width: `${checklistCompletion}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/clients/${id}/applications/${applicationId}/checklist`}
              className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Manage Checklist
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Application Journey
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <JourneyCard
            title="Offer"
            status={application.journey?.offerStatus || "not_started"}
            details={[
              {
                label: "Offer Type",
                value: application.journey?.offerType || "—",
              },
              {
                label: "Conditions",
                value: application.journey?.offerConditions || "—",
              },
              {
                label: "Received At",
                value: application.journey?.offerReceivedAt
                  ? new Date(
                      application.journey.offerReceivedAt
                    ).toLocaleDateString()
                  : "—",
              },
            ]}
          />

          <JourneyCard
            title="COE"
            status={application.journey?.coeStatus || "not_started"}
            details={[
              {
                label: "COE Number",
                value: application.journey?.coeNumber || "—",
              },
              {
                label: "Issued At",
                value: application.journey?.coeIssuedAt
                  ? new Date(application.journey.coeIssuedAt).toLocaleDateString()
                  : "—",
              },
            ]}
          />

          <JourneyCard
            title="Visa"
            status={application.journey?.visaStatus || "not_started"}
            details={[
              {
                label: "File Number",
                value: application.journey?.visaFileNumber || "—",
              },
              {
                label: "Lodged At",
                value: application.journey?.visaLodgedAt
                  ? new Date(application.journey.visaLodgedAt).toLocaleDateString()
                  : "—",
              },
              {
                label: "Granted At",
                value: application.journey?.visaGrantedAt
                  ? new Date(application.journey.visaGrantedAt).toLocaleDateString()
                  : "—",
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-gray-500">Journey Remarks</div>
          <div className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            {application.journey?.remarks || "No journey remarks added."}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function JourneyCard({
  title,
  status,
  details,
}: {
  title: string;
  status: string;
  details: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border">
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {details.map((detail) => (
          <div key={`${title}-${detail.label}`}>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {detail.label}
            </div>
            <div className="text-sm text-gray-800">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}