import Link from "next/link";
import { getWorkflows } from "@/lib/workflow-service";
import { requireAuth } from "@/lib/require-auth";

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getRuleCount(workflow: UnknownRecord) {
  const possibleKeys = [
    "automationRules",
    "workflowAutomationRules",
    "rules",
    "emailAutomationRules",
  ];

  for (const key of possibleKeys) {
    const value = workflow[key];
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  return 0;
}

function getActiveRuleCount(workflow: UnknownRecord) {
  const possibleKeys = [
    "automationRules",
    "workflowAutomationRules",
    "rules",
    "emailAutomationRules",
  ];

  for (const key of possibleKeys) {
    const value = workflow[key];
    if (Array.isArray(value)) {
      return value.filter(
        (item) => isObject(item) && getBoolean(item.isActive, false)
      ).length;
    }
  }

  return 0;
}

function InfoCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function WorkflowsPage() {
  await requireAuth();

  const workflows = await getWorkflows();
  const workflowItems: UnknownRecord[] = Array.isArray(workflows)
    ? workflows.filter(isObject)
    : [];

  const activeCount = workflowItems.filter((workflow) =>
    getBoolean(workflow.isActive, false)
  ).length;

  const inactiveCount = workflowItems.length - activeCount;

  const totalStages = workflowItems.reduce((sum, workflow) => {
    return sum + getArray(workflow.stages).length;
  }, 0);

  const totalRules = workflowItems.reduce((sum, workflow) => {
    return sum + getRuleCount(workflow);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.72)] ring-1 ring-slate-800 sm:px-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Settings / Workflow Engine
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Workflows
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Manage your CRM workflows, stage structures, and automation-ready
              pipeline definitions from a cleaner premium control panel.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Stages
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Activation
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Rule Visibility
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Settings
            </Link>

            <Link
              href="/workflows/new"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Add Workflow
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Total Workflows"
          value={String(workflowItems.length)}
          hint="All pipeline definitions"
        />
        <InfoCard
          label="Active Workflows"
          value={String(activeCount)}
          hint="Currently in use"
        />
        <InfoCard
          label="Inactive Workflows"
          value={String(inactiveCount)}
          hint="Available but disabled"
        />
        <InfoCard
          label="Automation Rules"
          value={String(totalRules)}
          hint="Detected linked workflow rules"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {workflowItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No workflows found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first workflow to define pipeline stages and future automation.
            </p>
            <div className="mt-5">
              <Link
                href="/workflows/new"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Workflow
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {workflowItems.map((workflow) => {
              const workflowId = getString(workflow.id, "");
              const workflowName = getString(workflow.name, "Unnamed Workflow");
              const description = getString(workflow.description, "");
              const isActive = getBoolean(workflow.isActive, false);
              const stages = getArray(workflow.stages);
              const ruleCount = getRuleCount(workflow);
              const activeRuleCount = getActiveRuleCount(workflow);

              return (
                <Link
                  key={workflowId || workflowName}
                  href={`/workflows/${workflowId}`}
                  className="block p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">
                          {workflowName}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-700 ring-slate-200"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>

                        {ruleCount > 0 ? (
                          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                            {ruleCount} Rules
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            No Rules
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {description || "No description"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          Stages: {stages.length}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          Active Rules: {activeRuleCount}
                        </span>
                        {ruleCount > 0 ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Automation Ready
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Structure Only
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-500">
                      View Details →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}