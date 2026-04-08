import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Plus,
  Upload,
  Globe2,
  Mail,
  MapPin,
  FolderOpen,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 backdrop-blur-sm transition",
        active
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200"
          : "bg-slate-500/10 text-slate-600 ring-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400",
        ].join(" ")}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-md">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs text-slate-300">{hint}</p>
      </div>
    </div>
  );
}

function ProviderStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Building2 className="h-3.5 w-3.5" />
              Provider Setup Required
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Start building your provider intelligence layer
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Import providers in bulk from CSV or create them manually one by
              one. Once providers are set up, course import becomes cleaner,
              safer, and much more scalable.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/providers/import"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              Import Providers
            </Link>

            <Link
              href="/providers/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add Provider
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-slate-200 bg-slate-50/60 px-6 py-6 sm:grid-cols-3 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            1. Import Providers
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Upload a clean CSV and preview records before commit.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            2. Validate & Deduplicate
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Review duplicates, fix invalid rows, and keep data production-safe.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            3. Import Courses Next
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Once providers exist, course matching becomes reliable and scalable.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ProvidersPage() {
  await requireAuth();

  const providers = await prisma.provider.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
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
  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const inactiveProviders = totalProviders - activeProviders;

  const totalCourses = providers.reduce((sum, provider) => {
    return sum + provider._count.courses;
  }, 0);

  const totalApplications = providers.reduce((sum, provider) => {
    return sum + provider._count.applications;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Premium Hero */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_24%)]" />
        <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200 backdrop-blur-md">
                <Building2 className="h-3.5 w-3.5" />
                Provider Intelligence
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-[2.6rem]">
                Education Providers
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage universities, colleges, and institutional partners from
                one premium workspace. Import providers in bulk, monitor course
                coverage, and prepare your data layer for cleaner course import
                and smarter operations.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/providers/import"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  <Upload className="h-4 w-4" />
                  Import Providers
                </Link>

                <Link
                  href="/providers/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Provider
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <MetricCard
                label="Providers"
                value={totalProviders}
                hint="Total institutions"
              />
              <MetricCard
                label="Active"
                value={activeProviders}
                hint={`${inactiveProviders} inactive`}
              />
              <MetricCard
                label="Courses"
                value={totalCourses}
                hint="Catalog coverage"
              />
              <MetricCard
                label="Applications"
                value={totalApplications}
                hint="Linked demand"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      {providers.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Top Action Strip */}
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  Provider Directory
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review provider profiles, monitor course coverage, and access
                  import tools directly from the provider workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/providers/import"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Upload className="h-4 w-4" />
                  Import Providers
                </Link>

                <Link
                  href="/providers/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Provider
                </Link>
              </div>
            </div>
          </section>

          {/* Provider Grid */}
          <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {providers.map((provider) => {
              const location = [provider.country, provider.city]
                .filter(Boolean)
                .join(" • ");

              return (
                <article
                  key={provider.id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.10)]"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                            <Building2 className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-slate-900">
                              {provider.name}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {location || "Location not set"}
                              </span>

                              {provider.code ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <FolderOpen className="h-3.5 w-3.5" />
                                  Code: {provider.code}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <StatusBadge active={provider.isActive} />
                    </div>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ProviderStat
                        label="Courses"
                        value={provider._count.courses}
                      />
                      <ProviderStat
                        label="Applications"
                        value={provider._count.applications}
                      />
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Contact Details
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="flex items-start gap-2">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="break-all">
                              {provider.email || "No email configured"}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="break-all">
                              {provider.website || "No website configured"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/providers/${provider.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-700"
                      >
                        View Provider
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                          href={`/providers/${provider.id}/edit`}
                          className="font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/providers/${provider.id}/courses`}
                          className="font-medium text-slate-700 transition hover:text-slate-900 hover:underline"
                        >
                          Courses
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}