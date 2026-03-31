import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export default async function ApplicationsPage() {
  await requireAuth();

  const applications = await prisma.clientApplication.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage student applications, provider selections, intake tracking,
              and progress across education and visa workflow.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Add Application
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 font-medium text-gray-600">Provider</th>
                <th className="px-4 py-3 font-medium text-gray-600">Course</th>
                <th className="px-4 py-3 font-medium text-gray-600">Intake</th>
                <th className="px-4 py-3 font-medium text-gray-600">Application</th>
                <th className="px-4 py-3 font-medium text-gray-600">Education Workflow</th>
                <th className="px-4 py-3 font-medium text-gray-600">Visa Workflow</th>
                <th className="px-4 py-3 font-medium text-gray-600">Applied At</th>
                <th className="px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>

            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <p className="text-sm font-medium text-gray-900">
                        No applications found
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Start by creating a new application for a client.
                      </p>
                      <div className="mt-4">
                        <Link
                          href="/applications/new"
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                        >
                          Add Application
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {application.client.firstName} {application.client.lastName}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {application.client.email || "No email"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {application.provider.name}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {application.course.name}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {application.intake} {application.intakeYear || ""}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${getApplicationStatusClass(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          No: {application.applicationNo || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          label={`Offer: ${application.journey?.offerStatus || "-"}`}
                          className={getJourneyStatusClass(
                            application.journey?.offerStatus
                          )}
                        />
                        <StatusBadge
                          label={`COE: ${application.journey?.coeStatus || "-"}`}
                          className={getJourneyStatusClass(
                            application.journey?.coeStatus
                          )}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          label={`Visa: ${application.journey?.visaStatus || "-"}`}
                          className={getJourneyStatusClass(
                            application.journey?.visaStatus
                          )}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {application.appliedAt
                        ? new Date(application.appliedAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/applications/${application.id}`}
                          className="text-sm font-medium text-black underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/applications/${application.id}/edit`}
                          className="text-sm font-medium text-blue-600 underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function getApplicationStatusClass(status: string | null | undefined) {
  const value = (status || "").toLowerCase();

  if (
    value.includes("approved") ||
    value.includes("completed") ||
    value.includes("active")
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    value.includes("pending") ||
    value.includes("draft") ||
    value.includes("processing")
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (
    value.includes("rejected") ||
    value.includes("cancelled") ||
    value.includes("closed")
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

function getJourneyStatusClass(status: string | null | undefined) {
  const value = (status || "").toLowerCase();

  if (
    value.includes("issued") ||
    value.includes("granted") ||
    value.includes("accepted") ||
    value.includes("unconditional_offer") ||
    value.includes("offered")
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    value.includes("pending") ||
    value.includes("preparing") ||
    value.includes("conditional_offer") ||
    value.includes("lodged") ||
    value.includes("applied")
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (value.includes("refused") || value.includes("rejected")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}