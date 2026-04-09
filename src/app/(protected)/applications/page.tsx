import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  Activity,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Layers3,
  Sparkles,
} from "lucide-react";

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
  const completed = applications.filter(a => a.status?.includes("granted")).length;
  const pending = applications.filter(a => a.status?.includes("pending")).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_70%,_#f8fafc)]">
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* 🔥 PREMIUM HEADER */}
        <section className="rounded-[32px] overflow-hidden border border-slate-200/70 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white px-6 py-8 lg:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:justify-between xl:items-center">

              <div className="flex gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-3xl bg-white/10">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-3xl font-semibold">Applications</h1>
                  <p className="text-sm text-slate-300 mt-2">
                    Manage student applications, workflows, and visa progress in a unified system.
                  </p>
                </div>
              </div>

              <Link
                href="/applications/new"
                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-2xl font-semibold hover:bg-gray-200 transition"
              >
                <FilePlus2 className="h-4 w-4" />
                Add Application
              </Link>
            </div>
          </div>
        </section>

        {/* 🔥 KPI CARDS */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard label="Total" value={total} icon={Layers3} />
          <KpiCard label="Active" value={active} icon={Activity} />
          <KpiCard label="Pending" value={pending} icon={Clock3} />
          <KpiCard label="Completed" value={completed} icon={CheckCircle2} />
        </div>

        {/* 🔥 TABLE */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white shadow-sm overflow-hidden">

          {applications.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-3xl bg-gray-100">
                <FilePlus2 className="h-6 w-6 text-gray-600" />
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                No applications yet
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Start building your pipeline by creating your first application.
              </p>

              <Link
                href="/applications/new"
                className="mt-6 inline-block bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800"
              >
                Create Application
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Client</th>
                    <th className="px-5 py-4 text-left">Provider</th>
                    <th className="px-5 py-4 text-left">Course</th>
                    <th className="px-5 py-4 text-left">Intake</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Workflow</th>
                    <th className="px-5 py-4 text-left">Date</th>
                    <th className="px-5 py-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t hover:bg-slate-50 transition">

                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {app.client.firstName} {app.client.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {app.client.email || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4">{app.provider.name}</td>
                      <td className="px-5 py-4">{app.course.name}</td>

                      <td className="px-5 py-4">
                        {app.intake} {app.intakeYear || ""}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={app.status} />
                      </td>

                      <td className="px-5 py-4 space-y-1">
                        <MiniBadge label={`Offer: ${app.journey?.offerStatus || "-"}`} />
                        <MiniBadge label={`Visa: ${app.journey?.visaStatus || "-"}`} />
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {app.appliedAt
                          ? new Date(app.appliedAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-5 py-4 flex gap-3">
                        <Link href={`/applications/${app.id}`} className="font-medium hover:underline">
                          View
                        </Link>
                        <Link href={`/applications/${app.id}/edit`} className="text-blue-600 hover:underline">
                          Edit
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* 🔥 COMPONENTS */

function KpiCard({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs uppercase text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
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

function MiniBadge({ label }: any) {
  return (
    <div className="text-xs bg-gray-100 px-2 py-1 rounded-md">
      {label}
    </div>
  );
}