import Link from "next/link";
import { getWorkflows } from "@/lib/workflow-service";
import { requireAuth } from "@/lib/require-auth";

type UnknownRecord = Record<string, unknown>;

type NormalizedRule = {
  id: string;
  workflowId: string;
  workflowName: string;
  name: string;
  description: string | null;
  templateKey: string;
  channelType: string;
  targetType: string;
  isActive: boolean;
  triggerLabel: string;
  stageName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatLabel(value: string) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function getRuleCollections(workflow: UnknownRecord): unknown[] {
  const possibleKeys = [
    "automationRules",
    "workflowAutomationRules",
    "rules",
    "emailAutomationRules",
  ];

  for (const key of possibleKeys) {
    const value = workflow[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeRules(workflows: unknown[]): NormalizedRule[] {
  const normalized: NormalizedRule[] = [];

  for (const workflowItem of workflows) {
    if (!isObject(workflowItem)) continue;

    const workflowId = getString(workflowItem.id, "");
    const workflowName = getString(workflowItem.name, "Unnamed Workflow");
    const rawRules = getRuleCollections(workflowItem);

    for (const rawRule of rawRules) {
      if (!isObject(rawRule)) continue;

      const toStage = isObject(rawRule.toStage) ? rawRule.toStage : null;
      const fromStage = isObject(rawRule.fromStage) ? rawRule.fromStage : null;

      const stageName = toStage
        ? getNullableString(toStage.stageName)
        : fromStage
          ? `From: ${getNullableString(fromStage.stageName) || "Unknown Stage"}`
          : null;

      normalized.push({
        id: getString(rawRule.id, `${workflowId}-${normalized.length + 1}`),
        workflowId,
        workflowName,
        name:
          getNullableString(rawRule.name) ||
          `${workflowName} Rule ${normalized.length + 1}`,
        description: getNullableString(rawRule.description),
        templateKey: getNullableString(rawRule.templateKey) || "not_configured",
        channelType: getNullableString(rawRule.channel) || "email",
        targetType: getNullableString(rawRule.targetType) || "client",
        isActive: getBoolean(rawRule.isActive, true),
        triggerLabel:
          getNullableString(rawRule.eventType) || "workflow_event",
        stageName,
        createdAt: getNullableString(rawRule.createdAt),
        updatedAt: getNullableString(rawRule.updatedAt),
      });
    }
  }

  return normalized.sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return a.workflowName.localeCompare(b.workflowName);
  });
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function StatCard({
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

function SectionHeader({
  title,
  description,
  href,
  hrefLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {hrefLabel || "View more"}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  text,
  actionHref,
  actionLabel,
}: {
  title: string;
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>

      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default async function EmailCenterPage() {
  await requireAuth();

  const workflows = await getWorkflows();
  const normalizedRules = normalizeRules(workflows as unknown[]);

  const activeRuleCount = normalizedRules.filter((rule) => rule.isActive).length;
  const inactiveRuleCount = normalizedRules.length - activeRuleCount;

  const channelCounts = countBy(
    normalizedRules.map((rule) => rule.channelType.toLowerCase())
  );
  const targetCounts = countBy(
    normalizedRules.map((rule) => rule.targetType.toLowerCase())
  );

  const workflowCount = Array.isArray(workflows) ? workflows.length : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.72)] ring-1 ring-slate-800 sm:px-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Communication Hub
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Email Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Manage workflow-driven email automation from one premium control
              center. Review template keys, delivery channels, recipient targets,
              and rule activity tied to your real workflow setup.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Workflow Rules
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Template Keys
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Channel Routing
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Target Logic
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/workflows"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Open Workflows
            </Link>

            <Link
              href="/email-center/templates"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Templates
            </Link>

            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Workflows"
          value={String(workflowCount)}
          hint="Connected workflow definitions"
        />
        <StatCard
          label="Automation Rules"
          value={String(normalizedRules.length)}
          hint="All discovered workflow rules"
        />
        <StatCard
          label="Active Rules"
          value={String(activeRuleCount)}
          hint="Currently enabled automations"
        />
        <StatCard
          label="Inactive Rules"
          value={String(inactiveRuleCount)}
          hint="Rules available but disabled"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
          <SectionHeader
            title="Automation Rules"
            description="Live workflow-linked communication rules across your CRM."
            href="/workflows"
            hrefLabel="Manage workflows"
          />

          <div className="mt-5">
            {normalizedRules.length === 0 ? (
              <EmptyState
                title="No automation rules found"
                text="Your workflows are available, but no workflow automation rules were detected from the current schema response. Once rules are attached in your workflow service, they will appear here automatically."
                actionHref="/workflows"
                actionLabel="Open Workflows"
              />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Rule
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Workflow
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Template Key
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Channel
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Target
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Trigger
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          State
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {normalizedRules.map((rule) => (
                        <tr key={rule.id} className="align-top">
                          <td className="px-5 py-4">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {rule.name}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {rule.description || "No description"}
                              </div>
                              {rule.stageName ? (
                                <div className="mt-2">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                    Stage: {rule.stageName}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {rule.workflowName}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {rule.templateKey}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                              {formatLabel(rule.channelType)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                              {formatLabel(rule.targetType)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                              {formatLabel(rule.triggerLabel)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                rule.isActive
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-slate-100 text-slate-700 ring-slate-200"
                              }`}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Channel Mix"
              description="Current delivery configuration detected from your rules."
            />

            <div className="mt-5 space-y-3">
              {normalizedRules.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No channel data available yet.
                </p>
              ) : (
                Object.entries(channelCounts).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {formatLabel(key)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 ring-1 ring-inset ring-slate-200">
                      {value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Target Types"
              description="Who receives your automation messages."
            />

            <div className="mt-5 space-y-3">
              {normalizedRules.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No target data available yet.
                </p>
              ) : (
                Object.entries(targetCounts).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {formatLabel(key)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 ring-1 ring-inset ring-slate-200">
                      {value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Operational Notes"
              description="How this page now works in your CRM."
            />

            <div className="mt-5 space-y-3">
              {[
                "Rules are read from your real workflow service response.",
                "Template keys, channels, targets, and state are surfaced automatically.",
                "Workflow stage transitions are shown from actual Prisma relations.",
                "This page is now tied to your real automation schema instead of fallback guesswork.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Recent Rule Metadata"
          description="Quick operational view for support and admin follow-up."
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {normalizedRules.length === 0 ? (
            <div className="lg:col-span-2 xl:col-span-3">
              <EmptyState
                title="No rule metadata available"
                text="Once automation rules are included in workflow retrieval, timestamps and lifecycle information will appear here."
              />
            </div>
          ) : (
            normalizedRules.slice(0, 6).map((rule) => (
              <div
                key={`meta-${rule.id}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {rule.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {rule.workflowName}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      rule.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-800">Template:</span>{" "}
                    {rule.templateKey}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Channel:</span>{" "}
                    {formatLabel(rule.channelType)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Target:</span>{" "}
                    {formatLabel(rule.targetType)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Trigger:</span>{" "}
                    {formatLabel(rule.triggerLabel)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Updated:</span>{" "}
                    {formatDateTime(rule.updatedAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}