import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type PageProps = {
  params: Promise<{
    id: string;
    courseId: string;
  }>;
};

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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {value !== null && value !== undefined && String(value).trim() !== ""
          ? String(value)
          : "—"}
      </p>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString()}`;
}

export default async function ProviderCourseDetailPage({ params }: PageProps) {
  await requireAuth();

  const { id, courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      providerId: id,
    },
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
      provider: {
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          country: true,
          isActive: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Course Detail
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {course.name}
                </h1>
                <StatusBadge active={course.isActive} />
              </div>

              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Review provider-linked course information, pricing, intake details,
                and operational context from one workspace.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  Provider: {course.provider.name}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  {course.provider.country || "No country"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  {course.provider.city || "No city"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Link
                href={`/providers/${course.provider.id}/courses`}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Back to Courses
              </Link>

              <Link
                href={`/providers/${course.provider.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Open Provider
              </Link>

              <Link
                href={`/providers/${course.provider.id}/courses/${course.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600"
              >
                Edit Course
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Course Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Read-only view of this provider course.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Course Name" value={course.name} />
              <InfoCard label="Level" value={course.level} />
              <InfoCard label="Duration" value={course.duration} />
              <InfoCard label="Campus" value={course.campus} />
              <InfoCard label="Intakes" value={course.intakeMonths} />
              <InfoCard
                label="Tuition Fee"
                value={formatCurrency(course.tuitionFee)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {course.description || "No description added."}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Provider Context
              </h2>
            </div>

            <div className="space-y-4 p-6">
              <InfoCard label="Provider" value={course.provider.name} />
              <InfoCard label="Provider Code" value={course.provider.code} />
              <InfoCard label="City" value={course.provider.city} />
              <InfoCard label="Country" value={course.provider.country} />
              <InfoCard
                label="Applications"
                value={course.applications.length}
              />
              <InfoCard
                label="Last Updated"
                value={new Date(course.updatedAt).toLocaleDateString()}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Quick Actions
              </h2>
            </div>

            <div className="grid gap-3 p-6">
              <Link
                href={`/providers/${course.provider.id}/courses/${course.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Edit Course
              </Link>

              <Link
                href={`/providers/${course.provider.id}/courses`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Catalog
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}