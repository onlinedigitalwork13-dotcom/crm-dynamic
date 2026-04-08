import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ArrowRight,
  BookOpen,
  Building2,
  FileSpreadsheet,
  GraduationCap,
  Plus,
} from "lucide-react";

function cardClassName() {
  return "rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm backdrop-blur";
}

export default async function CoursesConfigPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
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
  const totalCourses = providers.reduce(
    (sum, provider) => sum + provider._count.courses,
    0
  );
  const totalApplications = providers.reduce(
    (sum, provider) => sum + provider._count.applications,
    0
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700 px-6 py-8 text-white sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_25%)]" />
              <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                    <GraduationCap className="h-4 w-4" />
                    Course Operations
                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Course Management
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Select a provider and manage its course catalog, import
                    provider-linked course data, and maintain clean course
                    operations from one premium workspace.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/providers"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
                    >
                      <Building2 className="h-4 w-4" />
                      Provider Directory
                    </Link>

                    <a
                      href="#provider-course-entry"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Import Courses
                    </a>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Providers
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {totalProviders}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Available for course ops
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Active
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {activeProviders}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Active providers
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Courses
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {totalCourses}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Catalog records
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Applications
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {totalApplications}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Linked demand
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {providers.length === 0 ? (
            <section className={cardClassName()}>
              <div className="px-6 py-10 text-center sm:px-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-900">
                  <Building2 className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                  No providers found
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Add a provider first so you can import or manage courses in
                  proper provider context.
                </p>

                <div className="mt-6">
                  <Link
                    href="/providers/new"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Provider
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <section id="provider-course-entry" className="space-y-5 scroll-mt-24">
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm sm:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Provider Course Entry Points
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Open a provider course workspace, import course rows, or
                      add a new course directly in provider context.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/providers"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Building2 className="h-4 w-4" />
                      Provider Directory
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {providers.map((provider) => {
                  const location =
                    [provider.city, provider.country]
                      .filter(Boolean)
                      .join(", ") || "Location not set";

                  return (
                    <article
                      key={provider.id}
                      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="border-b border-slate-100 px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                              <Building2 className="h-6 w-6" />
                            </div>

                            <div>
                              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                                {provider.name}
                              </h3>

                              <div className="mt-2 text-sm text-slate-500">
                                {location}
                              </div>
                            </div>
                          </div>

                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              provider.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700",
                            ].join(" ")}
                          >
                            {provider.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 px-6 py-5">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            Courses
                          </div>
                          <div className="mt-2 text-3xl font-semibold text-slate-900">
                            {provider._count.courses}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            Applications
                          </div>
                          <div className="mt-2 text-3xl font-semibold text-slate-900">
                            {provider._count.applications}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 px-6 py-5">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/providers/${provider.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            View Provider
                          </Link>

                          <Link
                            href={`/providers/${provider.id}/courses`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <BookOpen className="h-4 w-4" />
                            Courses
                          </Link>

                          <Link
                            href={`/providers/${provider.id}/courses/import`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Import Courses
                          </Link>

                          <Link
                            href={`/providers/${provider.id}/courses/new`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add Course
                          </Link>
                        </div>

                        <Link
                          href={`/providers/${provider.id}/courses`}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                        >
                          Open course workspace
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}