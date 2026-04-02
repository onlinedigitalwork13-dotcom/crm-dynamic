import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString()}`;
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

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-3 md:grid-cols-[150px_1fr] md:gap-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default async function ProviderDetailPage({ params }: PageProps) {
  await requireAuth();

  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      courses: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          courses: true,
          applications: true,
        },
      },
    },
  });

  if (!provider) {
    notFound();
  }

  const activeCourses = provider.courses.filter((course) => course.isActive).length;
  const inactiveCourses = provider.courses.length - activeCourses;
  const latestCourse = provider.courses[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Provider Command Center
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {provider.name}
                </h1>
                <StatusBadge active={provider.isActive} />
              </div>

              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Premium provider workspace for profile visibility, course catalog
                oversight, and future sync-ready operations.
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

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Email
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-white">
                    {provider.email || "No email"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {provider.phone || "No phone"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Website
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-white">
                    {provider.website ? "Website available" : "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Latest Update
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatDate(provider.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:max-w-[420px] xl:justify-end">
              <Link
                href="/providers"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Back to Providers
              </Link>

              <Link
                href={`/providers/${provider.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600"
              >
                Edit Provider
              </Link>

              <Link
                href={`/providers/${provider.id}/courses`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                View Courses
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/80 px-6 py-5 md:grid-cols-2 xl:grid-cols-4 lg:px-8">
          <MetricCard
            label="Total Courses"
            value={provider._count.courses}
            subtext="All linked courses"
          />
          <MetricCard
            label="Applications"
            value={provider._count.applications}
            subtext="Linked application records"
          />
          <MetricCard
            label="Active Courses"
            value={activeCourses}
            subtext="Currently available offerings"
          />
          <MetricCard
            label="Inactive Courses"
            value={inactiveCourses}
            subtext="Archived or disabled courses"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-6">
          <SectionCard
            title="Provider Overview"
            description="Core provider profile information and business context."
          >
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="divide-y divide-slate-100">
                <DetailRow label="Name" value={provider.name} />
                <DetailRow label="Code" value={provider.code || "—"} />
                <DetailRow label="Country" value={provider.country || "—"} />
                <DetailRow label="City" value={provider.city || "—"} />
                <DetailRow label="Email" value={provider.email || "—"} />
                <DetailRow label="Phone" value={provider.phone || "—"} />
                <DetailRow
                  label="Website"
                  value={
                    provider.website ? (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Visit website
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailRow label="Created" value={formatDate(provider.createdAt)} />
                <DetailRow label="Last Updated" value={formatDate(provider.updatedAt)} />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Catalog Snapshot
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Provider Status
                    </p>
                    <div className="mt-1">
                      <StatusBadge active={provider.isActive} />
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Course Coverage
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {provider._count.courses} total courses
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Application Volume
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {provider._count.applications} linked applications
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Latest Course Added
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {latestCourse ? latestCourse.name : "No courses yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Description"
            description="Internal and public-facing provider notes."
          >
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
              {provider.description || "No description added."}
            </div>
          </SectionCard>

          <SectionCard
            title="Courses Overview"
            description="Preview of linked courses for this provider."
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/providers/${provider.id}/courses`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View All
                </Link>
                <Link
                  href={`/providers/${provider.id}/courses/new`}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Add Course
                </Link>
              </div>
            }
          >
            {provider.courses.length === 0 ? (
              <EmptyState message="No courses added for this provider yet." />
            ) : (
              <div className="space-y-4">
                {provider.courses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-950">
                            {course.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                              course.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {course.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                              Tuition Fee
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-800">
                              {formatCurrency(course.tuitionFee)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                              Last Updated
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-800">
                              {formatDate(course.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          {course.description || "No description added."}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link
                          href={`/providers/${provider.id}/courses/${course.id}/edit`}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {provider.courses.length > 5 ? (
                  <div className="pt-2">
                    <Link
                      href={`/providers/${provider.id}/courses`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View all {provider.courses.length} courses
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Quick Actions"
            description="Fast access to key provider operations."
          >
            <div className="grid gap-3">
              <Link
                href={`/providers/${provider.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Edit Provider
              </Link>

              <Link
                href={`/providers/${provider.id}/courses/new`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Add Course
              </Link>

              <Link
                href={`/providers/${provider.id}/courses`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Course Catalog
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Sync Readiness"
            description="Foundation for future automatic course and provider sync."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Current Mode
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Manual catalog management
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Next Upgrade
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  CSV import, sync metadata, logs, and provider source mapping.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                This section is intentionally phase-1 ready so we can add real
                sync services later without redesigning the whole provider page.
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}