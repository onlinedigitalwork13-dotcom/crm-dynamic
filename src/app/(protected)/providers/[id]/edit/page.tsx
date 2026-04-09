import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileEdit,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import EditProviderForm from "./provider-edit-form";

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

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default async function EditProviderPage({ params }: PageProps) {
  await requireAuth();

  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <Link href="/providers" className="transition hover:text-white">
                  Providers
                </Link>
                <span>/</span>
                <Link
                  href={`/providers/${provider.id}`}
                  className="transition hover:text-white"
                >
                  {provider.name}
                </Link>
                <span>/</span>
                <span className="font-medium text-white">Edit Provider</span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                    Provider Configuration
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Edit Provider
                    </h1>
                    <StatusBadge active={provider.isActive} />
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                    Update provider identity, contacts, web properties, sync
                    readiness, and operational notes in a premium future-ready
                    workspace.
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
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricPill
                  label="Primary Email"
                  value={provider.email || "Not provided"}
                />
                <MetricPill
                  label="Phone"
                  value={provider.phone || "Not provided"}
                />
                <MetricPill
                  label="Website"
                  value={provider.website || "Not provided"}
                />
                <MetricPill
                  label="Last Updated"
                  value={formatDate(provider.updatedAt)}
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[360px]">
              <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                  Edit Scope
                </p>
                <p className="mt-1 text-sm text-white">
                  Professional provider editing for business profile control,
                  sync metadata, and AI-import-ready operations.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-200" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Courses
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {provider._count.courses} linked
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-slate-200" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Applications
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {provider._count.applications} linked
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/providers/${provider.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Provider
                </Link>

                <Link
                  href={`/providers/${provider.id}/courses`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  <Globe2 className="h-4 w-4" />
                  View Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EditProviderForm
        provider={{
          id: provider.id,
          name: provider.name ?? "",
          code: provider.code ?? "",
          country: provider.country ?? "",
          city: provider.city ?? "",
          email: provider.email ?? "",
          phone: provider.phone ?? "",
          website: provider.website ?? "",
          description: provider.description ?? "",
          isActive: provider.isActive,

          legalName: provider.legalName ?? "",
          defaultCurrency: provider.defaultCurrency ?? "",
          supportEmail: provider.supportEmail ?? "",
          supportPhone: provider.supportPhone ?? "",
          admissionEmail: provider.admissionEmail ?? "",
          financeEmail: provider.financeEmail ?? "",
          applicationUrl: provider.applicationUrl ?? "",
          portalUrl: provider.portalUrl ?? "",
          logoUrl: provider.logoUrl ?? "",
          address: provider.address ?? "",
          notes: provider.notes ?? "",
          syncStatus: provider.syncStatus ?? "",
          lastSyncAt: provider.lastSyncAt
            ? provider.lastSyncAt.toISOString()
            : "",
          lastSyncMessage: provider.lastSyncMessage ?? "",
          autoSyncEnabled: provider.autoSyncEnabled,
          sourceType: provider.sourceType ?? "",
        }}
      />
    </div>
  );
}