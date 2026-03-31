"use client";

import { useMemo, useState } from "react";

type StageItem = {
  id: string;
  stageName: string;
  orderSequence: number;
  isFinal: boolean;
};

type RuleStage = {
  id: string;
  stageName: string;
  orderSequence: number;
  isFinal: boolean;
} | null;

type RuleItem = {
  id: string;
  name: string;
  description: string | null;
  workflowId: string;
  fromStageId: string | null;
  toStageId: string | null;
  eventType: string;
  targetType: string;
  channel: string;
  provider: string;
  templateKey: string;
  delayMinutes: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  fromStage?: RuleStage;
  toStage?: RuleStage;
};

type WorkflowAutomationRulesPanelProps = {
  workflowId: string;
  workflowName: string;
  stages: StageItem[];
  rules: RuleItem[];
};

type RuleFormState = {
  name: string;
  description: string;
  fromStageId: string;
  toStageId: string;
  eventType: string;
  targetType: string;
  channel: string;
  provider: string;
  templateKey: string;
  delayMinutes: string;
  isActive: boolean;
};

const defaultFormState: RuleFormState = {
  name: "",
  description: "",
  fromStageId: "",
  toStageId: "",
  eventType: "stage_changed",
  targetType: "client",
  channel: "email",
  provider: "system",
  templateKey: "",
  delayMinutes: "0",
  isActive: true,
};

function formatEnumLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function toDisplayDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

function StageBadge({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {label}: {value || "Any"}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function WorkflowAutomationRulesPanel({
  workflowId,
  workflowName,
  stages,
  rules,
}: WorkflowAutomationRulesPanelProps) {
  const [items, setItems] = useState<RuleItem[]>(rules);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultFormState);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => items.filter((rule) => rule.isActive).length,
    [items]
  );

  function resetForm() {
    setForm(defaultFormState);
    setError(null);
    setEditingRuleId(null);
    setIsCreating(false);
  }

  function startCreate() {
    setEditingRuleId(null);
    setForm(defaultFormState);
    setError(null);
    setIsCreating(true);
  }

  function startEdit(rule: RuleItem) {
    setEditingRuleId(rule.id);
    setIsCreating(true);
    setError(null);
    setForm({
      name: rule.name,
      description: rule.description || "",
      fromStageId: rule.fromStageId || "",
      toStageId: rule.toStageId || "",
      eventType: rule.eventType,
      targetType: rule.targetType,
      channel: rule.channel,
      provider: rule.provider,
      templateKey: rule.templateKey,
      delayMinutes: String(rule.delayMinutes ?? 0),
      isActive: rule.isActive,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Rule name is required.");
      return;
    }

    if (!form.templateKey.trim()) {
      setError("Template key is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      fromStageId: form.fromStageId || null,
      toStageId: form.toStageId || null,
      eventType: form.eventType,
      targetType: form.targetType,
      channel: form.channel,
      provider: form.provider,
      templateKey: form.templateKey.trim(),
      delayMinutes: Number(form.delayMinutes || 0),
      isActive: form.isActive,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(
        editingRuleId
          ? `/api/workflows/rules/${editingRuleId}`
          : `/api/workflows/${workflowId}/rules`,
        {
          method: editingRuleId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const raw = await response.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          `Server returned non-JSON response (status ${response.status}). Check workflow rules API route or auth redirect.`
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save rule.");
      }

      const savedRule = data.rule as RuleItem;

      setItems((prev) =>
        editingRuleId
          ? prev.map((item) => (item.id === savedRule.id ? savedRule : item))
          : [savedRule, ...prev]
      );

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(ruleId: string, nextState: boolean) {
    try {
      const response = await fetch(`/api/workflows/rules/${ruleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: nextState,
        }),
      });

      const raw = await response.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          `Server returned non-JSON response (status ${response.status}). Check /api/workflows/rules/[ruleId]/route.ts and auth middleware.`
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update rule.");
      }

      const updatedRule = data.rule as RuleItem;

      setItems((prev) =>
        prev.map((item) => (item.id === updatedRule.id ? updatedRule : item))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update rule.");
    }
  }

  async function handleDelete(ruleId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this automation rule?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/workflows/rules/${ruleId}`, {
        method: "DELETE",
      });

      const raw = await response.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          `Server returned non-JSON response (status ${response.status}). Check /api/workflows/rules/[ruleId]/route.ts and auth middleware.`
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete rule.");
      }

      setItems((prev) => prev.filter((item) => item.id !== ruleId));

      if (editingRuleId === ruleId) {
        resetForm();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete rule.");
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Automation Control
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Automation Rules
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Create and manage workflow rules for{" "}
              <span className="font-medium text-slate-800">{workflowName}</span>.
              These rules control channel, target, template key, stage transitions,
              and active state.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Total Rules" value={String(items.length)} />
            <MiniStat label="Active" value={String(activeCount)} />
            <MiniStat label="Stages" value={String(stages.length)} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Automation Rule
          </button>

          {isCreating ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {isCreating ? (
        <div className="border-b border-slate-200 bg-slate-50/70 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Rule Name" required>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="Stage change email"
                />
              </FormField>

              <FormField label="Template Key" required>
                <input
                  value={form.templateKey}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, templateKey: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="student_stage_update"
                />
              </FormField>

              <FormField label="Event Type" required>
                <input
                  value={form.eventType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, eventType: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="stage_changed"
                />
              </FormField>

              <FormField label="Channel" required>
                <select
                  value={form.channel}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, channel: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="email">Email</option>
                  <option value="in_app">In App</option>
                  <option value="both">Both</option>
                </select>
              </FormField>

              <FormField label="Target Type" required>
                <select
                  value={form.targetType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, targetType: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="client">Client</option>
                  <option value="assigned_user">Assigned User</option>
                  <option value="branch_admin">Branch Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </FormField>

              <FormField label="Provider" required>
                <select
                  value={form.provider}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, provider: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="system">System</option>
                  <option value="resend">Resend</option>
                  <option value="suprsend">SuprSend</option>
                </select>
              </FormField>

              <FormField label="From Stage">
                <select
                  value={form.fromStageId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fromStageId: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="">Any Stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.orderSequence}. {stage.stageName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="To Stage">
                <select
                  value={form.toStageId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, toStageId: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="">Any Stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.orderSequence}. {stage.stageName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Delay Minutes">
                <input
                  type="number"
                  min="0"
                  value={form.delayMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, delayMinutes: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                />
              </FormField>

              <FormField label="State">
                <label className="flex h-[50px] items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Active Rule
                </label>
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                placeholder="Optional operational description"
              />
            </FormField>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? editingRuleId
                    ? "Saving..."
                    : "Creating..."
                  : editingRuleId
                    ? "Save Changes"
                    : "Create Rule"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="p-6">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No automation rules yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first rule to connect workflow events with email, in-app,
              or multi-channel automation.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add First Rule
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((rule) => (
              <div
                key={rule.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {rule.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          rule.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>

                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                        {formatEnumLabel(rule.channel)}
                      </span>

                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                        {formatEnumLabel(rule.targetType)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {rule.description || "No description"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <StageBadge
                        label="From"
                        value={rule.fromStage?.stageName || null}
                      />
                      <StageBadge
                        label="To"
                        value={rule.toStage?.stageName || null}
                      />
                      <StageBadge
                        label="Event"
                        value={formatEnumLabel(rule.eventType)}
                      />
                      <StageBadge
                        label="Provider"
                        value={formatEnumLabel(rule.provider)}
                      />
                      <StageBadge label="Template" value={rule.templateKey} />
                      <StageBadge
                        label="Delay"
                        value={`${rule.delayMinutes || 0} min`}
                      />
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      Updated: {toDisplayDate(rule.updatedAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(rule.id, !rule.isActive)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {rule.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(rule)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(rule.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}