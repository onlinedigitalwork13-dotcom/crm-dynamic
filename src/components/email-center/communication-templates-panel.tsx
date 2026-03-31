"use client";

import { useMemo, useState } from "react";

type TemplateItem = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  channel: string;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type Props = {
  templates: TemplateItem[];
};

type FormState = {
  name: string;
  key: string;
  description: string;
  channel: string;
  subject: string;
  body: string;
  isActive: boolean;
};

const defaultFormState: FormState = {
  name: "",
  key: "",
  description: "",
  channel: "email",
  subject: "",
  body: "",
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

function formatDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

export default function CommunicationTemplatesPanel({ templates }: Props) {
  const [items, setItems] = useState<TemplateItem[]>(templates);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items]
  );

  function resetForm() {
    setForm(defaultFormState);
    setEditingId(null);
    setError(null);
    setIsOpen(false);
  }

  function startCreate() {
    setForm(defaultFormState);
    setEditingId(null);
    setError(null);
    setIsOpen(true);
  }

  function startEdit(template: TemplateItem) {
    setEditingId(template.id);
    setError(null);
    setForm({
      name: template.name,
      key: template.key,
      description: template.description || "",
      channel: template.channel,
      subject: template.subject || "",
      body: template.body,
      isActive: template.isActive,
    });
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Template name is required.");
      return;
    }

    if (!form.key.trim()) {
      setError("Template key is required.");
      return;
    }

    if (!form.body.trim()) {
      setError("Template body is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      key: form.key.trim(),
      description: form.description.trim() || null,
      channel: form.channel,
      subject: form.subject.trim() || null,
      body: form.body.trim(),
      isActive: form.isActive,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(
        editingId
          ? `/api/communication-templates/${editingId}`
          : `/api/communication-templates`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save template.");
      }

      const savedTemplate = data.template as TemplateItem;

      setItems((prev) =>
        editingId
          ? prev.map((item) => (item.id === savedTemplate.id ? savedTemplate : item))
          : [savedTemplate, ...prev]
      );

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(templateId: string, nextState: boolean) {
    try {
      const response = await fetch(`/api/communication-templates/${templateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: nextState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update template.");
      }

      const updatedTemplate = data.template as TemplateItem;

      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedTemplate.id ? updatedTemplate : item
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update template.");
    }
  }

  async function handleDelete(templateId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/communication-templates/${templateId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete template.");
      }

      setItems((prev) => prev.filter((item) => item.id !== templateId));

      if (editingId === templateId) {
        resetForm();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template.");
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Content Management
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Communication Templates
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Create and manage reusable message templates for your workflow
              automations and future delivery engine.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Total" value={String(items.length)} />
            <MiniStat label="Active" value={String(activeCount)} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Template
          </button>

          {isOpen ? (
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

      {isOpen ? (
        <div className="border-b border-slate-200 bg-slate-50/70 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Template Name" required>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="Student stage update"
                />
              </FormField>

              <FormField label="Template Key" required>
                <input
                  value={form.key}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, key: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="student_stage_update"
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
            </div>

            <FormField label="Description">
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                placeholder="Optional internal description"
              />
            </FormField>

            <FormField label="Subject">
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                placeholder="Your application has moved to a new stage"
              />
            </FormField>

            <FormField label="Body" required>
              <textarea
                rows={8}
                value={form.body}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, body: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                placeholder="Hello {{client.firstName}}, your workflow stage has been updated..."
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
                Active Template
              </label>
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
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                  ? "Save Changes"
                  : "Create Template"}
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
              No communication templates yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first reusable template for workflow automation and
              future sending flows.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add First Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((template) => (
              <div
                key={template.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {template.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          template.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>

                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                        {formatEnumLabel(template.channel)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                        {template.key}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {template.description || "No description"}
                    </p>

                    {template.subject ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Subject
                        </p>
                        <p className="mt-1 text-sm text-slate-800">{template.subject}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Body Preview
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {template.body}
                      </p>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      Updated: {formatDate(template.updatedAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(template.id, !template.isActive)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {template.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(template)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
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