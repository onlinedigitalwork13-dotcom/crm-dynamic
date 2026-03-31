"use client";

import { useEffect, useMemo, useState } from "react";

type ChecklistDocument = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type ChecklistItem = {
  id: string;
  applicationId: string;
  templateId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  isRequired: boolean;
  status:
    | "pending"
    | "requested"
    | "received"
    | "verified"
    | "rejected"
    | "waived";
  remarks?: string | null;
  dueDate?: string | null;
  sortOrder: number;
  verifiedAt?: string | null;
  verifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  documents: ChecklistDocument[];
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
    intake: string;
    intakeYear?: number | null;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone: string;
    };
    provider: {
      id: string;
      name: string;
    };
    course: {
      id: string;
      name: string;
    };
  };
  items: ChecklistItem[];
  summary: ChecklistSummary;
};

type ChecklistFormProps = {
  clientId: string;
  applicationId: string;
  applicationLabel: string;
};

type ManualItemForm = {
  title: string;
  description: string;
  category: string;
  isRequired: boolean;
  dueDate: string;
  sortOrder: string;
};

type UploadFormState = {
  [itemId: string]: {
    title: string;
    file: File | null;
  };
};

const defaultManualItemForm: ManualItemForm = {
  title: "",
  description: "",
  category: "",
  isRequired: true,
  dueDate: "",
  sortOrder: "",
};

function badgeClasses(status: ChecklistItem["status"]) {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800";
    case "received":
      return "bg-blue-100 text-blue-800";
    case "requested":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "waived":
      return "bg-gray-200 text-gray-800";
    case "pending":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChecklistForm({
  clientId,
  applicationId,
  applicationLabel,
}: ChecklistFormProps) {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [manualItemForm, setManualItemForm] =
    useState<ManualItemForm>(defaultManualItemForm);

  const [uploadForms, setUploadForms] = useState<UploadFormState>({});
  const [uploadInputKeys, setUploadInputKeys] = useState<Record<string, number>>(
    {}
  );
  const [itemEdits, setItemEdits] = useState<
    Record<string, Partial<ChecklistItem>>
  >({});

  async function loadChecklist() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/application-checklists?applicationId=${applicationId}`,
        {
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load checklist.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChecklist();
  }, [applicationId]);

  const hasItems = useMemo(() => {
    return Boolean(data?.items?.length);
  }, [data]);

  function setItemMessage(nextMessage: string | null) {
    setMessage(nextMessage);
    if (nextMessage) {
      setError(null);
    }
  }

  async function handleGenerateChecklist(replaceExisting = false) {
    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const res = await fetch("/api/application-checklists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate",
          applicationId,
          replaceExisting,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate checklist.");
      }

      setItemMessage("Checklist generated successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate checklist."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateManualItem(e: React.FormEvent) {
    e.preventDefault();

    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const res = await fetch("/api/application-checklists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-manual-item",
          applicationId,
          title: manualItemForm.title,
          description: manualItemForm.description || null,
          category: manualItemForm.category || null,
          isRequired: manualItemForm.isRequired,
          dueDate: manualItemForm.dueDate || null,
          sortOrder: manualItemForm.sortOrder
            ? Number(manualItemForm.sortOrder)
            : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create checklist item.");
      }

      setManualItemForm(defaultManualItemForm);
      setItemMessage("Manual checklist item created successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create checklist item."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveItem(itemId: string) {
    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const edit = itemEdits[itemId] || {};

      const res = await fetch(`/api/application-checklists/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: edit.title,
          description: edit.description,
          category: edit.category,
          isRequired: edit.isRequired,
          status: edit.status,
          remarks: edit.remarks,
          dueDate: edit.dueDate || null,
          sortOrder:
            typeof edit.sortOrder === "number" ? edit.sortOrder : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update checklist item.");
      }

      setItemEdits((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });

      setItemMessage("Checklist item updated successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update checklist item."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickAction(
    itemId: string,
    action: "verify" | "request" | "received" | "reject" | "waive",
    remarks?: string | null
  ) {
    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const res = await fetch(`/api/application-checklists/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          remarks: remarks ?? null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Failed to ${action} checklist item.`);
      }

      setItemMessage(`Checklist item updated: ${action}.`);
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} checklist item.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this checklist item?"
    );

    if (!confirmed) return;

    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const res = await fetch(`/api/application-checklists/${itemId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete checklist item.");
      }

      setItemMessage("Checklist item deleted successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete checklist item."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadDocument(itemId: string, e: React.FormEvent) {
    e.preventDefault();

    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const form = uploadForms[itemId];

      if (!form?.title?.trim()) {
        throw new Error("Document title is required.");
      }

      if (!form?.file) {
        throw new Error("Please choose a file to upload.");
      }

      const body = new FormData();
      body.append("title", form.title);
      body.append("file", form.file);

      const res = await fetch(`/api/application-checklists/${itemId}/upload`, {
        method: "POST",
        body,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to upload checklist document.");
      }

      setUploadForms((prev) => ({
        ...prev,
        [itemId]: {
          title: "",
          file: null,
        },
      }));

      setUploadInputKeys((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1,
      }));

      setItemMessage("Checklist document uploaded successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload checklist document."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this checklist document?"
    );

    if (!confirmed) return;

    try {
      setBusy(true);
      setItemMessage(null);
      setError(null);

      const res = await fetch(
        `/api/application-checklists/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete checklist document.");
      }

      setItemMessage("Checklist document deleted successfully.");
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete checklist document."
      );
    } finally {
      setBusy(false);
    }
  }

  function updateEditState(
    itemId: string,
    field: keyof ChecklistItem,
    value: unknown
  ) {
    setItemEdits((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  }

  function updateUploadTitle(itemId: string, value: string) {
  setUploadForms((prev) => ({
    ...prev,
    [itemId]: {
      title: value,
      file: prev[itemId]?.file || null,
    },
  }));
}

function updateUploadFile(itemId: string, file: File | null) {
  setUploadForms((prev) => ({
    ...prev,
    [itemId]: {
      title: prev[itemId]?.title || "",
      file,
    },
  }));
}

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading checklist...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">
          {error || "Failed to load checklist."}
        </p>
      </div>
    );
  }

  const { summary, items } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {applicationLabel}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Client ID: {clientId} • Application ID: {applicationId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleGenerateChecklist(false)}
              disabled={busy}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Checklist
            </button>

            <button
              type="button"
              onClick={() => handleGenerateChecklist(true)}
              disabled={busy}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
            >
              Regenerate & Replace
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-8">
          <SummaryCard label="Total Items" value={summary.totalItems} />
          <SummaryCard label="Required" value={summary.requiredItems} />
          <SummaryCard label="Received" value={summary.receivedItems} />
          <SummaryCard label="Verified" value={summary.verifiedItems} />
          <SummaryCard label="Pending" value={summary.pendingItems} />
          <SummaryCard label="Rejected" value={summary.rejectedItems} />
          <SummaryCard label="Waived" value={summary.waivedItems} />
          <SummaryCard
            label="Completion"
            value={`${summary.completionPercentage}%`}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Required Progress</span>
            <span className="text-gray-600">
              {summary.requiredCompletionPercentage}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all"
              style={{ width: `${summary.requiredCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Add Manual Checklist Item
        </h3>

        <form
          onSubmit={handleCreateManualItem}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={manualItemForm.title}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Portfolio"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              value={manualItemForm.category}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. academic"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={manualItemForm.description}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              placeholder="Optional note about this requirement"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={manualItemForm.dueDate}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sort Order
            </label>
            <input
              type="number"
              value={manualItemForm.sortOrder}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  sortOrder: e.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="999"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <input
              id="isRequired"
              type="checkbox"
              checked={manualItemForm.isRequired}
              onChange={(e) =>
                setManualItemForm((prev) => ({
                  ...prev,
                  isRequired: e.target.checked,
                }))
              }
            />
            <label htmlFor="isRequired" className="text-sm text-gray-700">
              Required item
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              Add Manual Item
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Checklist Items
          </h3>
          <span className="text-sm text-gray-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </div>

        {!hasItems ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-gray-600">
              No checklist items found yet. Generate the checklist to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const edit = itemEdits[item.id] || {};
              const uploadForm = uploadForms[item.id] || {
                title: "",
                file: null,
              };

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-gray-900">
                          {item.title}
                        </h4>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        {item.isRequired ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Required
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Optional
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          Category:{" "}
                          <span className="font-medium">
                            {item.category || "—"}
                          </span>
                        </p>
                        <p>
                          Due Date:{" "}
                          <span className="font-medium">
                            {formatDate(item.dueDate)}
                          </span>
                        </p>
                        <p>
                          Verified At:{" "}
                          <span className="font-medium">
                            {formatDate(item.verifiedAt)}
                          </span>
                        </p>
                        <p>
                          Verified By:{" "}
                          <span className="font-medium">
                            {item.verifiedBy
                              ? `${item.verifiedBy.firstName} ${item.verifiedBy.lastName}`
                              : "—"}
                          </span>
                        </p>
                      </div>

                      {item.description ? (
                        <p className="mt-3 text-sm text-gray-700">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAction(item.id, "request", item.remarks)
                        }
                        disabled={busy}
                        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        Request
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAction(item.id, "received", item.remarks)
                        }
                        disabled={busy}
                        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        Mark Received
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction(item.id, "verify")}
                        disabled={busy}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAction(item.id, "reject", item.remarks)
                        }
                        disabled={busy}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAction(item.id, "waive", item.remarks)
                        }
                        disabled={busy}
                        className="rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        Waive
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={busy}
                        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        defaultValue={item.title}
                        onChange={(e) =>
                          updateEditState(item.id, "title", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <input
                        type="text"
                        defaultValue={item.category || ""}
                        onChange={(e) =>
                          updateEditState(item.id, "category", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        defaultValue={item.status}
                        onChange={(e) =>
                          updateEditState(
                            item.id,
                            "status",
                            e.target.value as ChecklistItem["status"]
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="requested">requested</option>
                        <option value="received">received</option>
                        <option value="verified">verified</option>
                        <option value="rejected">rejected</option>
                        <option value="waived">waived</option>
                      </select>
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        defaultValue={item.description || ""}
                        onChange={(e) =>
                          updateEditState(item.id, "description", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        type="date"
                        defaultValue={
                          item.dueDate
                            ? new Date(item.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          updateEditState(item.id, "dueDate", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Remarks
                      </label>
                      <textarea
                        defaultValue={item.remarks || ""}
                        onChange={(e) =>
                          updateEditState(item.id, "remarks", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        defaultValue={item.sortOrder}
                        onChange={(e) =>
                          updateEditState(
                            item.id,
                            "sortOrder",
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2 xl:col-span-3 flex items-center gap-3">
                      <input
                        id={`required-${item.id}`}
                        type="checkbox"
                        defaultChecked={item.isRequired}
                        onChange={(e) =>
                          updateEditState(
                            item.id,
                            "isRequired",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        htmlFor={`required-${item.id}`}
                        className="text-sm text-gray-700"
                      >
                        Required item
                      </label>
                    </div>

                    <div className="md:col-span-2 xl:col-span-3">
                      <button
                        type="button"
                        onClick={() => handleSaveItem(item.id)}
                        disabled={busy}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save Item Changes
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="text-sm font-semibold text-gray-900">
                      Attached Documents
                    </h5>

                    {item.documents.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">
                        No documents uploaded yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {item.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">
                                {doc.title}
                              </p>
                              <p className="text-gray-600">
                                File: {doc.fileName}
                              </p>
                              <p className="text-gray-600">
                                Type: {doc.fileType || "—"}
                              </p>
                              <p className="text-gray-600">
                                Size: {formatFileSize(doc.fileSize)}
                              </p>
                              <p className="text-gray-500">
                                Added: {formatDate(doc.createdAt)}
                              </p>
                              <a
                                href={doc.filePath}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-blue-600 hover:underline"
                              >
                                Open File
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={busy}
                              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete Document
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => handleUploadDocument(item.id, e)}
                      className="mt-4 grid grid-cols-1 gap-4 rounded-md border bg-gray-50 p-4 md:grid-cols-2"
                    >
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={uploadForm.title}
                          onChange={(e) =>
                            updateUploadTitle(item.id, e.target.value)
                          }
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="Passport Front Page"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Choose File
                        </label>
                        <input
                          key={uploadInputKeys[item.id] || 0}
                          type="file"
                          onChange={(e) =>
                            updateUploadFile(
                              item.id,
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                        >
                          Upload Document
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}