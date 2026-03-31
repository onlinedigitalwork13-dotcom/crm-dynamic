"use client";

import { useEffect, useMemo, useState } from "react";

type ChecklistStatus =
  | "pending"
  | "requested"
  | "received"
  | "verified"
  | "rejected"
  | "waived";

type ChecklistDocument = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  createdAt?: string;
};

type ChecklistItem = {
  id: string;
  templateId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  isRequired: boolean;
  status: ChecklistStatus;
  remarks?: string | null;
  dueDate?: string | null;
  sortOrder?: number | null;
  documents?: ChecklistDocument[];
};

type ChecklistSummary = {
  totalItems: number;
  requiredItems: number;
  receivedItems: number;
  verifiedItems: number;
  pendingItems: number;
  rejectedItems: number;
  waivedItems: number;
  completionPercentage: number;
  requiredCompletionPercentage: number;
};

type ChecklistResponse = {
  application: {
    id: string;
    status: string;
    client?: {
      firstName: string;
      lastName: string;
    };
  };
  items: ChecklistItem[];
  summary: ChecklistSummary;
};

type Props = {
  applicationId: string;
};

export default function ChecklistManager({ applicationId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<ChecklistResponse | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("education");
  const [newIsRequired, setNewIsRequired] = useState(true);
  const [newDueDate, setNewDueDate] = useState("");

  async function loadChecklist() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/applications/${applicationId}/checklist`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to load checklist");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadChecklist();
  }, [applicationId]);

  const sortedItems = useMemo(() => {
    return [...(data?.items || [])].sort((a, b) => {
      const aOrder = a.sortOrder ?? 999;
      const bOrder = b.sortOrder ?? 999;
      return aOrder - bOrder;
    });
  }, [data?.items]);

  const standardItems = useMemo(
    () => sortedItems.filter((item) => item.templateId),
    [sortedItems]
  );

  const customItems = useMemo(
    () => sortedItems.filter((item) => !item.templateId),
    [sortedItems]
  );

  async function handleCreateItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newTitle.trim()) {
      setError("Custom checklist item title is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(`/api/applications/${applicationId}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          category: newCategory || null,
          isRequired: newIsRequired,
          dueDate: newDueDate || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create checklist item");
      }

      setNewTitle("");
      setNewDescription("");
      setNewCategory("education");
      setNewIsRequired(true);
      setNewDueDate("");
      setMessage("Custom checklist item added successfully.");

      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create checklist item"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateChecklist(replaceExisting = false) {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(`/api/applications/${applicationId}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate",
          replaceExisting,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to generate checklist");
      }

      setMessage(
        replaceExisting
          ? "Standard checklist replaced and regenerated successfully."
          : "Standard checklist generated successfully."
      );
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate checklist"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(itemId: string, nextStatus: ChecklistStatus) {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(
        `/api/applications/${applicationId}/checklist/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update checklist item");
      }

      setMessage("Checklist item updated successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update checklist item"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickAction(
    itemId: string,
    action: "request" | "received" | "verify" | "reject" | "waive"
  ) {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(
        `/api/applications/${applicationId}/checklist/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update checklist item");
      }

      setMessage("Checklist item updated successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update checklist item"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this checklist item?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await fetch(
        `/api/applications/${applicationId}/checklist/${itemId}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to delete checklist item");
      }

      setMessage("Checklist item deleted successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete checklist item"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading checklist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Application Checklist</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use standard template items for all applications, then add custom
              items only when needed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleGenerateChecklist(false)}
              disabled={saving}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Generate Standard Checklist
            </button>

            <button
              type="button"
              onClick={() => void handleGenerateChecklist(true)}
              disabled={saving}
              className="rounded-lg border border-yellow-300 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
            >
              Replace Standard Checklist
            </button>
          </div>
        </div>

        {data?.summary ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Items"
              value={String(data.summary.totalItems)}
            />
            <SummaryCard
              label="Verified"
              value={String(data.summary.verifiedItems)}
            />
            <SummaryCard
              label="Pending"
              value={String(data.summary.pendingItems)}
            />
            <SummaryCard
              label="Completion"
              value={`${data.summary.completionPercentage}%`}
            />
          </div>
        ) : null}

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

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Add Custom Checklist Item</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add only extra items that are not part of the standard checklist.
        </p>

        <form onSubmit={handleCreateItem} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Custom Item Title *
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Gap Explanation Letter"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Optional custom item description"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              >
                <option value="education">education</option>
                <option value="visa">visa</option>
                <option value="general">general</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newIsRequired}
              onChange={(e) => setNewIsRequired(e.target.checked)}
            />
            Required item
          </label>

          <div className="mt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Custom Item"}
            </button>
          </div>
        </form>
      </div>

      <ChecklistSection
        title="Standard Checklist Items"
        description="These come from the master template and keep applications consistent."
        items={standardItems}
        saving={saving}
        onStatusChange={handleStatusChange}
        onQuickAction={handleQuickAction}
        onDelete={handleDelete}
        emptyText="No standard checklist items yet. Generate the standard checklist first."
      />

      <ChecklistSection
        title="Custom Checklist Items"
        description="These are extra items added for special cases or provider-specific requirements."
        items={customItems}
        saving={saving}
        onStatusChange={handleStatusChange}
        onQuickAction={handleQuickAction}
        onDelete={handleDelete}
        emptyText="No custom checklist items added yet."
      />
    </div>
  );
}

function ChecklistSection({
  title,
  description,
  items,
  saving,
  onStatusChange,
  onQuickAction,
  onDelete,
  emptyText,
}: {
  title: string;
  description: string;
  items: ChecklistItem[];
  saving: boolean;
  onStatusChange: (itemId: string, nextStatus: ChecklistStatus) => Promise<void>;
  onQuickAction: (
    itemId: string,
    action: "request" | "received" | "verify" | "reject" | "waive"
  ) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {item.category || "general"}
                    </span>

                    {item.isRequired ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        required
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        optional
                      </span>
                    )}

                    {item.templateId ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        standard
                      </span>
                    ) : (
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                        custom
                      </span>
                    )}
                  </div>

                  {item.description ? (
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Due: {item.dueDate ? formatDate(item.dueDate) : "-"}</span>
                    <span>Documents: {item.documents?.length || 0}</span>
                  </div>

                  {item.remarks ? (
                    <div className="mt-3 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span className="font-medium">Remarks:</span> {item.remarks}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 lg:w-56">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      void onStatusChange(item.id, e.target.value as ChecklistStatus)
                    }
                    disabled={saving}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="pending">pending</option>
                    <option value="requested">requested</option>
                    <option value="received">received</option>
                    <option value="verified">verified</option>
                    <option value="rejected">rejected</option>
                    <option value="waived">waived</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void onQuickAction(item.id, "request")}
                      disabled={saving}
                      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Request
                    </button>

                    <button
                      type="button"
                      onClick={() => void onQuickAction(item.id, "received")}
                      disabled={saving}
                      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Received
                    </button>

                    <button
                      type="button"
                      onClick={() => void onQuickAction(item.id, "verify")}
                      disabled={saving}
                      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Verify
                    </button>

                    <button
                      type="button"
                      onClick={() => void onQuickAction(item.id, "reject")}
                      disabled={saving}
                      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onQuickAction(item.id, "waive")}
                    disabled={saving}
                    className="rounded-lg border border-yellow-300 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                  >
                    Waive
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    disabled={saving}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
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
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function getStatusClass(status: ChecklistStatus) {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-700";
    case "received":
      return "bg-blue-100 text-blue-700";
    case "requested":
      return "bg-yellow-100 text-yellow-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "waived":
      return "bg-purple-100 text-purple-700";
    case "pending":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}