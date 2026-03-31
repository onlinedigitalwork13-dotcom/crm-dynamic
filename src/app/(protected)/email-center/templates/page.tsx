import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { getCommunicationTemplates } from "@/lib/communication-template-service";
import CommunicationTemplatesPanel from "@/components/email-center/communication-templates-panel";

export default async function CommunicationTemplatesPage() {
  await requireAuth();

  const templates = await getCommunicationTemplates();

  const activeCount = templates.filter((template) => template.isActive).length;
  const inactiveCount = templates.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.72)] ring-1 ring-slate-800 sm:px-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Communication Hub / Templates
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Template Library
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Manage reusable communication templates for workflow automation,
              email center operations, and future notification delivery.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Reusable Keys
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Subject + Body
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Channel Aware
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/email-center"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Back to Email Center
            </Link>

            <Link
              href="/workflows"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Workflows
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Templates" value={String(templates.length)} />
        <StatCard label="Active Templates" value={String(activeCount)} />
        <StatCard label="Inactive Templates" value={String(inactiveCount)} />
      </div>

      <CommunicationTemplatesPanel templates={templates} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}