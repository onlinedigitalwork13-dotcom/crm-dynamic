import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import WorkflowStagesList from "@/components/workflows/workflow-stages-list";
import WorkflowAutomationRulesPanel from "@/components/workflows/workflow-automation-rules-panel";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkflowDetailPage({ params }: PageProps) {
  await requireAuth();

  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: [{ orderSequence: "asc" }, { createdAt: "asc" }],
      },
      automationRules: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          fromStage: {
            select: {
              id: true,
              stageName: true,
              orderSequence: true,
              isFinal: true,
            },
          },
          toStage: {
            select: {
              id: true,
              stageName: true,
              orderSequence: true,
              isFinal: true,
            },
          },
        },
      },
      _count: {
        select: {
          clients: true,
          automationRules: true,
        },
      },
    },
  });

  if (!workflow) {
    notFound();
  }

  const finalStageCount = workflow.stages.filter((stage) => stage.isFinal).length;
  const activeRuleCount = workflow.automationRules.filter((rule) => rule.isActive).length;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.72)] ring-1 ring-slate-800 sm:px-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Settings / Workflow Engine / Details
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {workflow.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              {workflow.description || "No description"}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                  workflow.isActive
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                    : "bg-white/10 text-slate-200 ring-white/15"
                }`}
              >
                {workflow.isActive ? "Active" : "Inactive"}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                {workflow.stages.length} Stages
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                {workflow._count.automationRules} Rules
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Settings
            </Link>

            <Link
              href="/workflows"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Workflows
            </Link>

            <Link
              href={`/workflows/${workflow.id}/edit`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Edit Workflow
            </Link>

            <Link
              href={`/workflows/${workflow.id}/stages/new`}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Add Stage
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Total Stages" value={String(workflow.stages.length)} />
        <InfoCard label="Final Stages" value={String(finalStageCount)} />
        <InfoCard label="Assigned Clients" value={String(workflow._count.clients)} />
        <InfoCard label="Active Rules" value={String(activeRuleCount)} />
      </div>

      <WorkflowAutomationRulesPanel
        workflowId={workflow.id}
        workflowName={workflow.name}
        stages={workflow.stages}
        rules={workflow.automationRules}
      />

      {workflow.stages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Workflow Stages</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the ordered stages used in this workflow pipeline.
            </p>
          </div>

          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">No stages added yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first stage to start building this workflow.
            </p>
            <div className="mt-4">
              <Link
                href={`/workflows/${workflow.id}/stages/new`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Stage
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <WorkflowStagesList workflowId={workflow.id} stages={workflow.stages} />
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
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