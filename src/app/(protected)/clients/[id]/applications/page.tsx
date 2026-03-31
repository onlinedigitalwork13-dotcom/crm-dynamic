import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DeleteApplicationButton from "./delete-application-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ClientApplicationsPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          provider: true,
          course: true,
          journey: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Clients / Applications</p>
          <h1 className="text-3xl font-bold">
            {client.firstName} {client.lastName} Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage education applications for this client
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/clients/${client.id}`}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Client
          </Link>
          <Link
            href={`/clients/${client.id}/applications/new`}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add Application
          </Link>
        </div>
      </div>

      {client.applications.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">No applications found</h2>
          <p className="mt-2 text-sm text-gray-500">
            Start by creating the first application for this client.
          </p>
          <Link
            href={`/clients/${client.id}/applications/new`}
            className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add First Application
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {client.applications.map((application) => (
            <div
              key={application.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold">
                      {application.provider.name}
                    </h2>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {formatStatusLabel(application.status)}
                    </span>

                    {application.journey && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Journey Active
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-900">Course:</span>{" "}
                      {application.course.name}
                    </p>

                    <p>
                      <span className="font-medium text-gray-900">Intake:</span>{" "}
                      {application.intake}
                      {application.intakeYear ? ` ${application.intakeYear}` : ""}
                    </p>

                    <p>
                      <span className="font-medium text-gray-900">
                        Application No:
                      </span>{" "}
                      {application.applicationNo || "-"}
                    </p>

                    <p>
                      <span className="font-medium text-gray-900">Applied At:</span>{" "}
                      {application.appliedAt
                        ? new Date(application.appliedAt).toLocaleDateString()
                        : "-"}
                    </p>

                    <p>
                      <span className="font-medium text-gray-900">Offer Date:</span>{" "}
                      {application.offerDate
                        ? new Date(application.offerDate).toLocaleDateString()
                        : "-"}
                    </p>

                    {application.journey && (
                      <>
                        <p>
                          <span className="font-medium text-gray-900">
                            Offer Status:
                          </span>{" "}
                          {formatStatusLabel(application.journey.offerStatus)}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            COE Status:
                          </span>{" "}
                          {formatStatusLabel(application.journey.coeStatus)}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Visa Status:
                          </span>{" "}
                          {formatStatusLabel(application.journey.visaStatus)}
                        </p>
                      </>
                    )}
                  </div>

                  {application.notes && (
                    <p className="pt-2 text-sm text-gray-700">
                      {application.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/clients/${client.id}/applications/${application.id}`}
                    className="rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    View Journey
                  </Link>

                  <Link
                    href={`/clients/${client.id}/applications/${application.id}/edit`}
                    className="rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </Link>

                  <DeleteApplicationButton
                    applicationId={application.id}
                    clientId={client.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}