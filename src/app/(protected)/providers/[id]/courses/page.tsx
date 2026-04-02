import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { Prisma } from "@prisma/client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    q?: string | string[];
    status?: string | string[];
    level?: string | string[];
    campus?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString()}`;
}

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      search.set(key, value);
    }
  });

  const result = search.toString();
  return result ? `?${result}` : "";
}

export default async function ProviderCoursesPage({
  params,
  searchParams,
}: PageProps) {
  await requireAuth();

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const q = firstValue(resolvedSearchParams.q).trim();
  const status = firstValue(resolvedSearchParams.status).trim().toLowerCase();
  const level = firstValue(resolvedSearchParams.level).trim();
  const campus = firstValue(resolvedSearchParams.campus).trim();

  const provider = await prisma.provider.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      country: true,
      isActive: true,
      _count: {
        select: {
          courses: true,
          applications: true,
        },
      },
      courses: {
        select: {
          id: true,
          name: true,
          level: true,
          duration: true,
          tuitionFee: true,
          intakeMonths: true,
          campus: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!provider) {
    notFound();
  }

  const where: Prisma.CourseWhereInput = {
    providerId: provider.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { level: { contains: q, mode: "insensitive" } },
            { campus: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { intakeMonths: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
      ? { isActive: false }
      : {}),
    ...(level ? { level: { equals: level, mode: "insensitive" } } : {}),
    ...(campus ? { campus: { equals: campus, mode: "insensitive" } } : {}),
  };

  const filteredCourses = await prisma.course.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const activeCourses = provider.courses.filter((course) => course.isActive).length;
  const inactiveCourses = provider.courses.length - activeCourses;

  const distinctLevels = Array.from(
    new Set(
      provider.courses
        .map((course) => course.level?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

  const distinctCampuses = Array.from(
    new Set(
      provider.courses
        .map((course) => course.campus?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasFilters = Boolean(q || status || level || campus);

  const resetHref = `/providers/${provider.id}/courses`;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Course Intelligence
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {provider.name} Courses
                </h1>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                    provider.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  {provider.isActive ? "Active Provider" : "Inactive Provider"}
                </span>
              </div>

              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Premium catalog workspace for course visibility, quick filtering,
                and future sync-ready provider operations.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  {provider.country || "No country"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  {provider.city || "No city"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  Code: {provider.code || "Not set"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:max-w-[420px] xl:justify-end">
              <Link
                href={`/providers/${provider.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Back to Provider
              </Link>

              <Link
                href={`/providers/${provider.id}/courses/new`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600"
              >
                Add Course
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/80 px-6 py-5 md:grid-cols-2 xl:grid-cols-4 lg:px-8">
          <MetricCard
            label="Total Courses"
            value={provider._count.courses}
            subtext="All provider-linked courses"
          />
          <MetricCard
            label="Active Courses"
            value={activeCourses}
            subtext="Currently available offerings"
          />
          <MetricCard
            label="Applications"
            value={provider._count.applications}
            subtext="Linked application records"
          />
          <MetricCard
            label="Filtered Results"
            value={filteredCourses.length}
            subtext={hasFilters ? "Based on active filters" : "Showing full catalog"}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Search & Filters
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the provider catalog by course name, level, campus, and status.
            </p>
          </div>

          {hasFilters ? (
            <Link
              href={resetHref}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Reset Filters
            </Link>
          ) : null}
        </div>

        <div className="p-6">
          <form
            method="get"
            className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_0.9fr_0.9fr_0.9fr_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Course name, level, campus, intake"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Level
              </label>
              <select
                name="level"
                defaultValue={level}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="">All levels</option>
                {distinctLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Campus
              </label>
              <select
                name="campus"
                defaultValue={campus}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="">All campuses</option>
                {distinctCampuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </form>

          {hasFilters ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {q ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Search: {q}
                </span>
              ) : null}
              {status ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Status: {status}
                </span>
              ) : null}
              {level ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Level: {level}
                </span>
              ) : null}
              {campus ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Campus: {campus}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Course Catalog
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Provider course cards designed for fast scanning and future sync-readiness.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {filteredCourses.length} result{filteredCourses.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="p-6">
            {filteredCourses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No courses matched the current filters.
                <div className="mt-4">
                  <Link
                    href={resetHref}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Clear filters
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 transition hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-slate-950">
                          {course.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {course.description || "No description added."}
                        </p>
                      </div>

                      <StatusBadge active={course.isActive} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Level
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {course.level || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Duration
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {course.duration || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Campus
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {course.campus || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Intakes
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {course.intakeMonths || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:col-span-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Tuition Fee
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {formatCurrency(course.tuitionFee)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <p className="text-xs text-slate-500">
                        Updated: {new Date(course.updatedAt).toLocaleDateString()}
                      </p>

                      <div className="flex gap-3">
                        <Link
                          href={`/providers/${provider.id}/courses/${course.id}`}
                          className="text-sm font-medium text-slate-900 hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/providers/${provider.id}/courses/${course.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast operational actions for this provider catalog.
              </p>
            </div>

            <div className="grid gap-3 p-6">
              <Link
                href={`/providers/${provider.id}/courses/new`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Add New Course
              </Link>

              <Link
                href={`/providers/${provider.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Provider Profile
              </Link>

              <Link
                href={`/providers/${provider.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit Provider
              </Link>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Sync Readiness
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Structured foundation for future course import and sync.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Current Mode
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Manual course catalog management
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Next Upgrade
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  CSV import, source mapping, sync logs, and change tracking for fees,
                  intake updates, and archived courses.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                This page is now structured so we can add real catalog automation
                later without rebuilding the UX from scratch.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="hidden">
        {buildQueryString({
          q,
          status,
          level,
          campus,
        })}
      </div>
    </div>
  );
}