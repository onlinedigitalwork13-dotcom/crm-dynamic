import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export default async function ApplicationsPage() {
  await requireAuth();

  const applications = await prisma.clientApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
    },
  });

  const total = applications.length;
  const active = applications.filter(a => a.status?.includes("applied")).length;
  const completed = applications.filter(a =>
    a.status?.includes("granted")
  ).length;
  const pending = applications.filter(a =>
    a.status?.includes("pending")
  ).length;

  return (
    <div className="space-y-6">

      {/* 🔥 HEADER */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Applications
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage student applications, workflows, and progress tracking across education and visa processes.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Application
          </Link>
        </div>
      </div>

      {/* 🔥 KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total" value={total} />
        <KpiCard label="Active" value={active} />
        <KpiCard label="Pending" value={pending} />
        <KpiCard label="Completed" value={completed} />
      </div>

      {/* 🔥 TABLE / EMPTY */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-gray-900">
              No applications yet
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Start by creating your first application and manage workflows efficiently.
            </p>

            <Link
              href="/applications/new"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Create Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Provider</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Intake</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Workflow</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t hover:bg-gray-50 transition">

                    {/* CLIENT */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {app.client.firstName} {app.client.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.client.email || "No email"}
                      </div>
                    </td>

                    {/* PROVIDER */}
                    <td className="px-5 py-4 text-gray-700">
                      {app.provider.name}
                    </td>

                    {/* COURSE */}
                    <td className="px-5 py-4 text-gray-700">
                      {app.course.name}
                    </td>

                    {/* INTAKE */}
                    <td className="px-5 py-4 text-gray-700">
                      {app.intake} {app.intakeYear || ""}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* WORKFLOW */}
                    <td className="px-5 py-4 space-y-1">
                      <MiniBadge label={`Offer: ${app.journey?.offerStatus || "-"}`} />
                      <MiniBadge label={`Visa: ${app.journey?.visaStatus || "-"}`} />
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-4 text-gray-600">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <Link href={`/applications/${app.id}`} className="text-black font-medium hover:underline">
                          View
                        </Link>
                        <Link href={`/applications/${app.id}/edit`} className="text-blue-600 font-medium hover:underline">
                          Edit
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* 🔥 COMPONENTS */

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = (status || "").toLowerCase();

  let style = "bg-gray-100 text-gray-700";

  if (value.includes("granted") || value.includes("approved"))
    style = "bg-green-100 text-green-700";
  else if (value.includes("pending"))
    style = "bg-yellow-100 text-yellow-700";
  else if (value.includes("rejected"))
    style = "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style}`}>
      {status || "-"}
    </span>
  );
}

function MiniBadge({ label }: { label: string }) {
  return (
    <div className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
      {label}
    </div>
  );
}