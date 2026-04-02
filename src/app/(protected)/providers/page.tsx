import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function ProvidersPage() {
  await requireAuth();

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          courses: true,
          applications: true,
        },
      },
    },
  });

  const totalProviders = providers.length;
  const activeProviders = providers.filter((p) => p.isActive).length;
  const totalCourses = providers.reduce(
    (acc, p) => acc + p._count.courses,
    0
  );
  const totalApplications = providers.reduce(
    (acc, p) => acc + p._count.applications,
    0
  );

  return (
    <div className="space-y-6">
      {/* 🔥 HERO */}
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Provider Intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Education Providers
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage universities, sync course catalogs, and monitor provider performance.
            </p>
          </div>

          <Link
            href="/providers/new"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            + Add Provider
          </Link>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Providers" value={totalProviders} />
          <Metric label="Active" value={activeProviders} />
          <Metric label="Courses" value={totalCourses} />
          <Metric label="Applications" value={totalApplications} />
        </div>
      </div>

      {/* 📊 PROVIDER GRID */}
      {providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No providers found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {provider.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {provider.country || "No country"} •{" "}
                    {provider.city || "No city"}
                  </p>
                </div>

                <StatusBadge active={provider.isActive} />
              </div>

              {/* Info */}
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Code:</span>{" "}
                  {provider.code || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Email:</span>{" "}
                  {provider.email || "-"}
                </p>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Courses</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {provider._count.courses}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Applications</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {provider._count.applications}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link
                  href={`/providers/${provider.id}`}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  View
                </Link>

                <div className="flex gap-3">
                  <Link
                    href={`/providers/${provider.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>

                  <Link
                    href={`/providers/${provider.id}/courses`}
                    className="text-sm text-slate-600 hover:underline"
                  >
                    Courses
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}