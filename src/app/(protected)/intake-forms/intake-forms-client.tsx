"use client";

import { useMemo, useState } from "react";

type FormStatus = "draft" | "active" | "inactive" | "archived";
type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "number"
  | "date"
  | "checkbox";

type FormSchemaField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type IntakeFormItem = {
  id: string;
  branchId: string;
  createdById: string;
  assignedToId: string | null;
  token: string;
  title: string;
  description: string | null;
  status: FormStatus;
  isActive: boolean;
  publicUrl: string | null;
  qrCodeValue: string | null;
  submitButtonText: string | null;
  successMessage: string | null;
  formSchema: unknown;
  settings: unknown;
  notes: string | null;
  sharedAt: Date | string | null;
  expiresAt: Date | string | null;
  lastSubmittedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    submissions: number;
  };
};

type Props = {
  forms: IntakeFormItem[];
};

type BuilderState = {
  title: string;
  description: string;
  token: string;
  submitButtonText: string;
  successMessage: string;
  status: FormStatus;
  isActive: boolean;
  notes: string;
  fields: FormSchemaField[];
};

const defaultFields: FormSchemaField[] = [
  {
    id: "firstName",
    label: "First Name",
    type: "text",
    required: true,
    placeholder: "Enter first name",
  },
  {
    id: "lastName",
    label: "Last Name",
    type: "text",
    required: true,
    placeholder: "Enter last name",
  },
  {
    id: "email",
    label: "Email",
    type: "email",
    required: false,
    placeholder: "Enter email address",
  },
  {
    id: "phone",
    label: "Phone Number",
    type: "text",
    required: true,
    placeholder: "Enter phone number",
  },
  {
    id: "notes",
    label: "Additional Notes",
    type: "textarea",
    required: false,
    placeholder: "Write any extra details here",
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function safeFields(value: unknown): FormSchemaField[] {
  if (!Array.isArray(value)) return defaultFields;

  const parsed = value.filter((field): field is FormSchemaField => {
    return (
      typeof field === "object" &&
      field !== null &&
      "id" in field &&
      "label" in field &&
      "type" in field
    );
  });

  return parsed.length > 0 ? parsed : defaultFields;
}

function emptyBuilderState(): BuilderState {
  return {
    title: "",
    description: "",
    token: "",
    submitButtonText: "Submit",
    successMessage: "Thank you. Your form has been submitted successfully.",
    status: "draft",
    isActive: true,
    notes: "",
    fields: defaultFields,
  };
}

function buildStateFromForm(form: IntakeFormItem): BuilderState {
  return {
    title: form.title,
    description: form.description || "",
    token: form.token,
    submitButtonText: form.submitButtonText || "Submit",
    successMessage:
      form.successMessage ||
      "Thank you. Your form has been submitted successfully.",
    status: form.status,
    isActive: form.isActive,
    notes: form.notes || "",
    fields: safeFields(form.formSchema),
  };
}

function getStatusBadgeClass(status: FormStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-yellow-100 text-yellow-700";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "archived":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getActiveBadgeClass(isActive: boolean) {
  return isActive
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";
}

export default function IntakeFormsClient({ forms }: Props) {
  const [items, setItems] = useState(forms);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createData, setCreateData] = useState<BuilderState>(emptyBuilderState());
  const [editData, setEditData] = useState<BuilderState>(emptyBuilderState());

  const currentForm = useMemo(
    () => items.find((item) => item.id === editingId) || null,
    [items, editingId]
  );

  function updateCreateField<K extends keyof BuilderState>(
    key: K,
    value: BuilderState[K]
  ) {
    setCreateData((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditField<K extends keyof BuilderState>(
    key: K,
    value: BuilderState[K]
  ) {
    setEditData((prev) => ({ ...prev, [key]: value }));
  }

  function addBuilderField(mode: "create" | "edit") {
    const newField: FormSchemaField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
    };

    if (mode === "create") {
      setCreateData((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
    }
  }

  function updateBuilderField(
    mode: "create" | "edit",
    index: number,
    updates: Partial<FormSchemaField>
  ) {
    const setter = mode === "create" ? setCreateData : setEditData;

    setter((prev) => {
      const fields = [...prev.fields];
      const existing = fields[index];

      if (!existing) return prev;

      const nextField: FormSchemaField = {
        ...existing,
        ...updates,
      };

      if (updates.label && !updates.id) {
        const autoId = slugify(updates.label);
        if (autoId) {
          nextField.id = autoId;
        }
      }

      if (updates.type && updates.type !== "select") {
        delete nextField.options;
      }

      if (updates.type === "select" && !nextField.options) {
        nextField.options = ["Option 1"];
      }

      fields[index] = nextField;

      return {
        ...prev,
        fields,
      };
    });
  }

  function removeBuilderField(mode: "create" | "edit", index: number) {
    const setter = mode === "create" ? setCreateData : setEditData;

    setter((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  }

  function moveBuilderField(
    mode: "create" | "edit",
    index: number,
    direction: "up" | "down"
  ) {
    const setter = mode === "create" ? setCreateData : setEditData;

    setter((prev) => {
      const fields = [...prev.fields];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= fields.length) {
        return prev;
      }

      [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];

      return {
        ...prev,
        fields,
      };
    });
  }

  function updateSelectOptions(
    mode: "create" | "edit",
    index: number,
    rawValue: string
  ) {
    const options = rawValue
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    updateBuilderField(mode, index, { options });
  }

  function validateBuilderState(state: BuilderState) {
    if (!state.title.trim()) {
      throw new Error("Title is required");
    }

    if (!state.fields.length) {
      throw new Error("Add at least one field to the form");
    }

    const ids = new Set<string>();

    for (const field of state.fields) {
      if (!field.label.trim()) {
        throw new Error("Every field must have a label");
      }

      const fieldId = field.id.trim() || slugify(field.label);

      if (!fieldId) {
        throw new Error(`Field "${field.label}" needs a valid ID`);
      }

      if (ids.has(fieldId)) {
        throw new Error(`Duplicate field ID found: ${fieldId}`);
      }

      ids.add(fieldId);

      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        throw new Error(`Dropdown field "${field.label}" needs at least one option`);
      }
    }
  }

  function normalizeFields(fields: FormSchemaField[]): FormSchemaField[] {
    return fields.map((field) => ({
      id: field.id.trim() || slugify(field.label),
      label: field.label.trim(),
      type: field.type,
      required: Boolean(field.required),
      placeholder:
        field.type === "checkbox" || field.type === "select"
          ? undefined
          : field.placeholder?.trim() || undefined,
      options:
        field.type === "select"
          ? (field.options || []).map((option) => option.trim()).filter(Boolean)
          : undefined,
    }));
  }

  async function handleCreate() {
    setSaving(true);
    setMessage(null);

    try {
      validateBuilderState(createData);

      const payload = {
        title: createData.title.trim(),
        description: createData.description.trim() || null,
        token: createData.token.trim(),
        submitButtonText: createData.submitButtonText.trim() || "Submit",
        successMessage:
          createData.successMessage.trim() ||
          "Thank you. Your form has been submitted successfully.",
        formSchema: normalizeFields(createData.fields),
        status: createData.status,
        isActive: createData.isActive,
        notes: createData.notes.trim() || null,
      };

      const response = await fetch("/api/intake-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create form");
      }

      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create form");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;

    setSaving(true);
    setMessage(null);

    try {
      validateBuilderState(editData);

      const payload = {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        token: editData.token.trim(),
        submitButtonText: editData.submitButtonText.trim() || "Submit",
        successMessage:
          editData.successMessage.trim() ||
          "Thank you. Your form has been submitted successfully.",
        formSchema: normalizeFields(editData.fields),
        status: editData.status,
        isActive: editData.isActive,
        notes: editData.notes.trim() || null,
      };

      const response = await fetch(`/api/intake-forms/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update form");
      }

      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update form");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(
    formId: string,
    updates: { status: FormStatus; isActive: boolean }
  ) {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/intake-forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update form status");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === formId
            ? {
                ...item,
                status: updates.status,
                isActive: updates.isActive,
                sharedAt:
                  updates.status === "active"
                    ? item.sharedAt || new Date().toISOString()
                    : item.sharedAt,
              }
            : item
        )
      );

      if (editingId === formId && currentForm) {
        setEditData((prev) => ({
          ...prev,
          status: updates.status,
          isActive: updates.isActive,
        }));
      }

      setMessage(
        updates.status === "active"
          ? "Form published successfully"
          : "Form updated successfully"
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update form status"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this intake form?"
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/intake-forms/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete form");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      setMessage("Form deleted successfully");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete form");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(token: string) {
    const publicLink = `${window.location.origin}/forms/${token}`;
    await navigator.clipboard.writeText(publicLink);
    setMessage("Public form link copied");
  }

  function openEdit(form: IntakeFormItem) {
    setEditingId(form.id);
    setEditData(buildStateFromForm(form));
    setMessage(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function closeEdit() {
    setEditingId(null);
    setEditData(emptyBuilderState());
  }

  function renderBuilderFields(
    mode: "create" | "edit",
    fields: FormSchemaField[]
  ) {
    return (
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={`${mode}-${index}-${field.id}`} className="rounded-xl border p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => moveBuilderField(mode, index, "up")}
                className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Move Up
              </button>

              <button
                type="button"
                onClick={() => moveBuilderField(mode, index, "down")}
                className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Move Down
              </button>

              <button
                type="button"
                onClick={() => removeBuilderField(mode, index)}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remove Field
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Field Label</label>
                <input
                  value={field.label}
                  onChange={(e) =>
                    updateBuilderField(mode, index, { label: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Field label"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Field ID</label>
                <input
                  value={field.id}
                  onChange={(e) =>
                    updateBuilderField(mode, index, { id: slugify(e.target.value) })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="field_id"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Field Type</label>
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateBuilderField(mode, index, {
                      type: e.target.value as FieldType,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Dropdown</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(e) =>
                      updateBuilderField(mode, index, {
                        required: e.target.checked,
                      })
                    }
                  />
                  Required Field
                </label>
              </div>
            </div>

            {field.type !== "checkbox" && field.type !== "select" ? (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium">Placeholder</label>
                <input
                  value={field.placeholder || ""}
                  onChange={(e) =>
                    updateBuilderField(mode, index, {
                      placeholder: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Placeholder text"
                />
              </div>
            ) : null}

            {field.type === "select" ? (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium">
                  Dropdown Options
                </label>
                <textarea
                  value={(field.options || []).join("\n")}
                  onChange={(e) => updateSelectOptions(mode, index, e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder={`Option 1\nOption 2\nOption 3`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add one option per line.
                </p>
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addBuilderField(mode)}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Add Field
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold">Intake Forms</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create, publish, and manage fully customizable public intake forms.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">Create New Form</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={createData.title}
              onChange={(e) => updateCreateField("title", e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Student Intake Form"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Token</label>
            <input
              value={createData.token}
              onChange={(e) => updateCreateField("token", e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="student-intake-form"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={createData.description}
            onChange={(e) => updateCreateField("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Public intake form for new enquiries"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Submit Button Text
            </label>
            <input
              value={createData.submitButtonText}
              onChange={(e) => updateCreateField("submitButtonText", e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={createData.status}
              onChange={(e) =>
                updateCreateField("status", e.target.value as FormStatus)
              }
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Success Message</label>
          <textarea
            value={createData.successMessage}
            onChange={(e) => updateCreateField("successMessage", e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">Custom Fields</label>
          {renderBuilderFields("create", createData.fields)}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            value={createData.notes}
            onChange={(e) => updateCreateField("notes", e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={createData.isActive}
            onChange={(e) => updateCreateField("isActive", e.target.checked)}
          />
          Active
        </label>

        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          {saving ? "Saving..." : "Create Form"}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((form) => (
          <div key={form.id} className="rounded-xl border bg-white p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{form.title}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                      form.status
                    )}`}
                  >
                    {form.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getActiveBadgeClass(
                      form.isActive
                    )}`}
                  >
                    {form.isActive ? "active" : "inactive"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {form.description || "No description"}
                </p>

                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>Token: {form.token}</p>
                  <p>Submissions: {form._count.submissions}</p>
                  <p>Branch: {form.branch.name}</p>
                  <p>
                    Public Path: <span className="font-mono">/forms/{form.token}</span>
                  </p>
                  <p>
                    Last Submitted:{" "}
                    {form.lastSubmittedAt
                      ? new Date(form.lastSubmittedAt).toLocaleString()
                      : "No submissions yet"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(form.token)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Copy Link
                </button>

                <a
                  href={`/forms/${form.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Open Public Form
                </a>

                {form.status !== "active" || !form.isActive ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void handleQuickStatusChange(form.id, {
                        status: "active",
                        isActive: true,
                      })
                    }
                    className="rounded-lg bg-black px-3 py-2 text-sm text-white"
                  >
                    Publish Form
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void handleQuickStatusChange(form.id, {
                        status: "inactive",
                        isActive: false,
                      })
                    }
                    className="rounded-lg border border-yellow-300 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                  >
                    Deactivate
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openEdit(form)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(form.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentForm ? (
        <div className="rounded-xl border bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Edit Form: {currentForm.title}
            </h2>
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                value={editData.title}
                onChange={(e) => updateEditField("title", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Token</label>
              <input
                value={editData.token}
                onChange={(e) => updateEditField("token", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => updateEditField("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Submit Button Text
              </label>
              <input
                value={editData.submitButtonText}
                onChange={(e) =>
                  updateEditField("submitButtonText", e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={editData.status}
                onChange={(e) => updateEditField("status", e.target.value as FormStatus)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Success Message
            </label>
            <textarea
              value={editData.successMessage}
              onChange={(e) => updateEditField("successMessage", e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">Custom Fields</label>
            {renderBuilderFields("edit", editData.fields)}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={editData.notes}
              onChange={(e) => updateEditField("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editData.isActive}
              onChange={(e) => updateEditField("isActive", e.target.checked)}
            />
            Active
          </label>

          {message ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleQuickStatusChange(currentForm.id, {
                  status: "active",
                  isActive: true,
                })
              }
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Publish
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleQuickStatusChange(currentForm.id, {
                  status: "inactive",
                  isActive: false,
                })
              }
              className="rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50"
            >
              Deactivate
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}