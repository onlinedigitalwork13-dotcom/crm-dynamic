"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ChecklistTemplate = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  category?: string | null;
  isRequired: boolean;
  allowMulti: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  code: string;
  description: string;
  category: string;
  isRequired: boolean;
  allowMulti: boolean;
  isActive: boolean;
  sortOrder: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    code: "",
    description: "",
    category: "education",
    isRequired: true,
    allowMulti: false,
    isActive: true,
    sortOrder: "999",
  };
}

function toTemplateCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function ChecklistTemplatesPage() {
  const [items, setItems] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createData, setCreateData] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<FormState>(emptyForm());

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/checklist-templates", {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to load checklist templates");
      }

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load checklist templates"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items]
  );

  function updateCreateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setCreateData((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setEditData((prev) => ({ ...prev, [key]: value }));
  }

  function openEdit(item: ChecklistTemplate) {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      code: item.code || "",
      description: item.description || "",
      category: item.category || "general",
      isRequired: item.isRequired,
      allowMulti: item.allowMulti,
      isActive: item.isActive,
      sortOrder: String(item.sortOrder ?? 999),
    });
    setMessage(null);
    setError(null);
  }

  function closeEdit() {
    setEditingId(null);
    setEditData(emptyForm());
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!createData.name.trim()) {
      setError("Template name is required.");
      return;
    }

    const finalCode = createData.code.trim()
      ? toTemplateCode(createData.code)
      : toTemplateCode(createData.name);

    if (!finalCode) {
      setError("Template code is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch("/api/checklist-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createData.name.trim(),
          code: finalCode,
          description: createData.description.trim() || null,
          category: createData.category.trim() || null,
          isRequired: createData.isRequired,
          allowMulti: createData.allowMulti,
          isActive: createData.isActive,
          sortOrder: Number(createData.sortOrder || 999),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create template");
      }

      setCreateData(emptyForm());
      setMessage("Checklist template created successfully.");
      await loadTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;

    if (!editData.name.trim()) {
      setError("Template name is required.");
      return;
    }

    const finalCode = editData.code.trim()
      ? toTemplateCode(editData.code)
      : toTemplateCode(editData.name);

    if (!finalCode) {
      setError("Template code is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(`/api/checklist-templates/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          code: finalCode,
          description: editData.description.trim() || null,
          category: editData.category.trim() || null,
          isRequired: editData.isRequired,
          allowMulti: editData.allowMulti,
          isActive: editData.isActive,
          sortOrder: Number(editData.sortOrder || 999),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update template");
      }

      setMessage("Checklist template updated successfully.");
      closeEdit();
      await loadTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: ChecklistTemplate) {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(`/api/checklist-templates/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update template");
      }

      setMessage("Checklist template updated successfully.");
      await loadTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this checklist template?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(`/api/checklist-templates/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to delete template");
      }

      if (editingId === id) {
        closeEdit();
      }

      setMessage("Checklist template deleted successfully.");
      await loadTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete template"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Settings / Checklist Templates</p>
            <h1 className="text-2xl font-bold">Checklist Templates</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage the master checklist catalog used to generate standard
              application checklists.
            </p>
          </div>

          <Link
            href="/settings"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Settings
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard label="Total Templates" value={String(items.length)} />
          <InfoCard label="Active Templates" value={String(activeCount)} />
          <InfoCard
            label="Inactive Templates"
            value={String(items.length - activeCount)}
          />
        </div>

        {message ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Create Template</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Template Name *
            </label>
            <input
              value={createData.name}
              onChange={(e) => updateCreateField("name", e.target.value)}
              placeholder="Passport Copy"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Template Code
            </label>
            <input
              value={createData.code}
              onChange={(e) =>
                updateCreateField("code", toTemplateCode(e.target.value))
              }
              placeholder="PASSPORT_COPY"
              className="w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none focus:border-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to auto-generate from name.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              value={createData.description}
              onChange={(e) => updateCreateField("description", e.target.value)}
              placeholder="Optional template description"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={createData.category}
              onChange={(e) => updateCreateField("category", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="education">education</option>
              <option value="visa">visa</option>
              <option value="general">general</option>
              <option value="financial">financial</option>
              <option value="compliance">compliance</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sort Order
            </label>
            <input
              type="number"
              value={createData.sortOrder}
              onChange={(e) => updateCreateField("sortOrder", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={createData.isRequired}
              onChange={(e) => updateCreateField("isRequired", e.target.checked)}
            />
            Required
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={createData.allowMulti}
              onChange={(e) => updateCreateField("allowMulti", e.target.checked)}
            />
            Allow Multiple Documents
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={createData.isActive}
              onChange={(e) => updateCreateField("isActive", e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Template"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Template Catalog</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading templates...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No checklist templates created yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>

                      <Badge
                        className={
                          item.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {item.isActive ? "active" : "inactive"}
                      </Badge>

                      <Badge className="bg-blue-100 text-blue-700">
                        {item.category || "general"}
                      </Badge>

                      <Badge
                        className={
                          item.isRequired
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {item.isRequired ? "required" : "optional"}
                      </Badge>

                      <Badge
                        className={
                          item.allowMulti
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {item.allowMulti ? "multi-file" : "single-file"}
                      </Badge>
                    </div>

                    {item.description ? (
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    ) : null}

                    <div className="mt-3 text-xs text-gray-500">
                      Code: {item.code} • Sort Order: {item.sortOrder}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-64 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleToggleActive(item)}
                      disabled={saving}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={saving}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
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

      {editingId ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Edit Template</h2>
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template Name *
              </label>
              <input
                value={editData.name}
                onChange={(e) => updateEditField("name", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template Code
              </label>
              <input
                value={editData.code}
                onChange={(e) =>
                  updateEditField("code", toTemplateCode(e.target.value))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows={3}
                value={editData.description}
                onChange={(e) => updateEditField("description", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={editData.category}
                onChange={(e) => updateEditField("category", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              >
                <option value="education">education</option>
                <option value="visa">visa</option>
                <option value="general">general</option>
                <option value="financial">financial</option>
                <option value="compliance">compliance</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sort Order
              </label>
              <input
                type="number"
                value={editData.sortOrder}
                onChange={(e) => updateEditField("sortOrder", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editData.isRequired}
                onChange={(e) => updateEditField("isRequired", e.target.checked)}
              />
              Required
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editData.allowMulti}
                onChange={(e) => updateEditField("allowMulti", e.target.checked)}
              />
              Allow Multiple Documents
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editData.isActive}
                onChange={(e) => updateEditField("isActive", e.target.checked)}
              />
              Active
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleUpdate()}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}