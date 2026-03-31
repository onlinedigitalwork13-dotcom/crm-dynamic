"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";

type FormField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  width?: "full" | "half" | "third" | "quarter";
  options?: { label: string; value: string }[];
  visible?: boolean;
};

type FormSection = {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
};

type FormBuilderClientProps = {
  form: {
    id: string;
    title: string;
    token: string;
    publicUrl: string | null;
    qrCodeValue: string | null;
    description?: string | null;
    submitButtonText?: string | null;
    successMessage?: string | null;
    formSchema?: unknown;
    isActive?: boolean;
    status?: string;
  };
};

function isFormSectionArray(value: unknown): value is FormSection[] {
  return (
    Array.isArray(value) &&
    value.every(
      (section) =>
        typeof section === "object" &&
        section !== null &&
        "key" in section &&
        "title" in section &&
        "fields" in section
    )
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function moveItem<T>(items: T[], from: number, to: number) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function getWidthClass(width?: FormField["width"]) {
  switch (width) {
    case "half":
      return "md:col-span-6";
    case "third":
      return "md:col-span-4";
    case "quarter":
      return "md:col-span-3";
    case "full":
    default:
      return "md:col-span-12";
  }
}

export default function FormBuilderClient({ form }: FormBuilderClientProps) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState(form.title ?? "");
  const [description, setDescription] = useState(form.description ?? "");
  const [submitButtonText, setSubmitButtonText] = useState(
    form.submitButtonText ?? "Submit"
  );
  const [successMessage, setSuccessMessage] = useState(
    form.successMessage ?? "Form submitted successfully."
  );
  const [isActive, setIsActive] = useState(Boolean(form.isActive));
  const [status, setStatus] = useState(form.status ?? "draft");

  const [schema, setSchema] = useState<FormSection[]>(
    isFormSectionArray(form.formSchema) ? form.formSchema : []
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (selectedSectionIndex > schema.length - 1) {
      setSelectedSectionIndex(Math.max(0, schema.length - 1));
    }
  }, [schema, selectedSectionIndex]);

  const selectedSection =
    schema.length > 0 ? schema[selectedSectionIndex] : null;

  useEffect(() => {
    if (!selectedSection) {
      setSelectedFieldIndex(0);
      return;
    }

    if (selectedFieldIndex > selectedSection.fields.length - 1) {
      setSelectedFieldIndex(Math.max(0, selectedSection.fields.length - 1));
    }
  }, [selectedSection, selectedFieldIndex]);

  const selectedField =
    selectedSection && selectedSection.fields.length > 0
      ? selectedSection.fields[selectedFieldIndex]
      : null;

  const publicPath = form.publicUrl || `/forms/${form.token}`;
  const publicLink = origin ? `${origin}${publicPath}` : "";
  const qrValue = publicLink || publicPath;

  const totalFields = useMemo(
    () => schema.reduce((sum, section) => sum + section.fields.length, 0),
    [schema]
  );

  const handleCopy = async () => {
    try {
      if (!publicLink) return;
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleDownloadQr = () => {
    const svg = qrWrapperRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.token || "intake-form"}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addSection = () => {
    const nextIndex = schema.length + 1;
    setSchema((prev) => [
      ...prev,
      {
        key: `section_${nextIndex}`,
        title: `New Section ${nextIndex}`,
        description: "",
        fields: [],
      },
    ]);
    setSelectedSectionIndex(schema.length);
    setSelectedFieldIndex(0);
  };

  const updateSection = (
    sectionIndex: number,
    updates: Partial<FormSection>
  ) => {
    setSchema((prev) =>
      prev.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      )
    );
  };

  const removeSection = (sectionIndex: number) => {
    setSchema((prev) => prev.filter((_, index) => index !== sectionIndex));
    setSelectedFieldIndex(0);
  };

  const moveSectionUp = (sectionIndex: number) => {
    if (sectionIndex === 0) return;
    setSchema((prev) => moveItem(prev, sectionIndex, sectionIndex - 1));
    setSelectedSectionIndex(sectionIndex - 1);
  };

  const moveSectionDown = (sectionIndex: number) => {
    if (sectionIndex === schema.length - 1) return;
    setSchema((prev) => moveItem(prev, sectionIndex, sectionIndex + 1));
    setSelectedSectionIndex(sectionIndex + 1);
  };

  const addField = (sectionIndex: number) => {
    setSchema((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) return section;

        const nextIndex = section.fields.length + 1;

        return {
          ...section,
          fields: [
            ...section.fields,
            {
              key: `field_${nextIndex}`,
              label: `New Field ${nextIndex}`,
              type: "text",
              required: false,
              placeholder: "",
              width: "full",
              visible: true,
            },
          ],
        };
      })
    );
  };

  const updateField = (
    sectionIndex: number,
    fieldIndex: number,
    updates: Partial<FormField>
  ) => {
    setSchema((prev) =>
      prev.map((section, sIndex) => {
        if (sIndex !== sectionIndex) return section;

        return {
          ...section,
          fields: section.fields.map((field, fIndex) =>
            fIndex === fieldIndex ? { ...field, ...updates } : field
          ),
        };
      })
    );
  };

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    setSchema((prev) =>
      prev.map((section, sIndex) => {
        if (sIndex !== sectionIndex) return section;

        return {
          ...section,
          fields: section.fields.filter((_, fIndex) => fIndex !== fieldIndex),
        };
      })
    );
  };

  const duplicateField = (sectionIndex: number, fieldIndex: number) => {
    setSchema((prev) =>
      prev.map((section, sIndex) => {
        if (sIndex !== sectionIndex) return section;

        const field = section.fields[fieldIndex];
        const duplicated: FormField = {
          ...field,
          key: `${field.key}_copy`,
          label: `${field.label} Copy`,
        };

        const newFields = [...section.fields];
        newFields.splice(fieldIndex + 1, 0, duplicated);

        return {
          ...section,
          fields: newFields,
        };
      })
    );
  };

  const moveFieldUp = (sectionIndex: number, fieldIndex: number) => {
    if (fieldIndex === 0) return;
    setSchema((prev) =>
      prev.map((section, sIndex) => {
        if (sIndex !== sectionIndex) return section;
        return {
          ...section,
          fields: moveItem(section.fields, fieldIndex, fieldIndex - 1),
        };
      })
    );
    setSelectedFieldIndex(fieldIndex - 1);
  };

  const moveFieldDown = (sectionIndex: number, fieldIndex: number) => {
    const section = schema[sectionIndex];
    if (!section || fieldIndex === section.fields.length - 1) return;

    setSchema((prev) =>
      prev.map((currentSection, sIndex) => {
        if (sIndex !== sectionIndex) return currentSection;
        return {
          ...currentSection,
          fields: moveItem(currentSection.fields, fieldIndex, fieldIndex + 1),
        };
      })
    );
    setSelectedFieldIndex(fieldIndex + 1);
  };

  const saveForm = async () => {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`/api/intake-forms/${form.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          submitButtonText,
          successMessage,
          isActive,
          status,
          formSchema: schema,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save form.");
      }

      setMessage("Form saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to save form."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-gradient-to-r from-gray-900 via-gray-800 to-black px-6 py-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-300">
                Advanced Builder
              </p>
              <h1 className="mt-2 text-2xl font-bold">Customize Intake Form</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300">
                Build sections, arrange fields, manage sharing, and preview the
                final form experience from one dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-300">Sections</p>
                <p className="mt-1 text-xl font-semibold">{schema.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-300">Fields</p>
                <p className="mt-1 text-xl font-semibold">{totalFields}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-300">Status</p>
                <p className="mt-1 text-sm font-semibold uppercase">{status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Token: {form.token}
            </span>
          </div>

          <button
            type="button"
            onClick={saveForm}
            disabled={saving}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Form"}
          </button>
        </div>

        {message ? (
          <div className="mx-6 mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
              >
                + Add
              </button>
            </div>

            {schema.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-gray-500">
                No sections yet.
              </div>
            ) : (
              <div className="space-y-3">
                {schema.map((section, index) => (
                  <button
                    key={`${section.key}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedSectionIndex(index);
                      setSelectedFieldIndex(0);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedSectionIndex === index
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {section.title || `Section ${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {section.fields.length} field
                          {section.fields.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium uppercase text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Share</h2>
            <p className="mt-1 text-sm text-gray-600">
              Copy the public link or download the QR.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Public Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicLink || "Generating link..."}
                    readOnly
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!publicLink}
                    className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <div
                  ref={qrWrapperRef}
                  className="flex justify-center rounded-lg bg-white p-4"
                >
                  <QRCode value={qrValue} size={180} />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Form Details</h2>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Form Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  placeholder="Enter form title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  placeholder="Short description for users"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Submit Button Text
                  </label>
                  <input
                    value={submitButtonText}
                    onChange={(e) => setSubmitButtonText(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                    placeholder="Submit"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Success Message
                </label>
                <textarea
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  placeholder="Shown after successful submission"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Make this form active
              </label>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Section Editor
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Select a section and then click a field to edit its details.
                </p>
              </div>
            </div>

            {!selectedSection ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-gray-500">
                Add a section to start building your form.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveSectionUp(selectedSectionIndex)}
                    className="rounded-lg border px-3 py-2 text-sm text-gray-700"
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSectionDown(selectedSectionIndex)}
                    className="rounded-lg border px-3 py-2 text-sm text-gray-700"
                  >
                    Move Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(selectedSectionIndex)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                  >
                    Remove Section
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Section Title
                    </label>
                    <input
                      value={selectedSection.title}
                      onChange={(e) =>
                        updateSection(selectedSectionIndex, {
                          title: e.target.value,
                          key: slugify(e.target.value || "section"),
                        })
                      }
                      className="w-full rounded-xl border px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Section Key
                    </label>
                    <input
                      value={selectedSection.key}
                      onChange={(e) =>
                        updateSection(selectedSectionIndex, {
                          key: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Section Description
                  </label>
                  <input
                    value={selectedSection.description ?? ""}
                    onChange={(e) =>
                      updateSection(selectedSectionIndex, {
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="rounded-2xl border bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Fields</h3>
                      <p className="text-xs text-gray-500">
                        Click a field to edit its details
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addField(selectedSectionIndex);
                        setSelectedFieldIndex(selectedSection.fields.length);
                      }}
                      className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
                    >
                      + Add Field
                    </button>
                  </div>

                  {selectedSection.fields.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-white px-4 py-8 text-center text-sm text-gray-500">
                      No fields in this section yet.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        {selectedSection.fields.map((field, fieldIndex) => (
                          <button
                            key={`${field.key}-${fieldIndex}`}
                            type="button"
                            onClick={() => setSelectedFieldIndex(fieldIndex)}
                            className={`w-full rounded-xl border p-4 text-left transition ${
                              selectedFieldIndex === fieldIndex
                                ? "border-black bg-white shadow-sm"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {field.label || `Field ${fieldIndex + 1}`}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {field.key} • {field.type} • {field.width ?? "full"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {field.required ? (
                                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                    required
                                  </span>
                                ) : null}

                                {field.visible === false ? (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    hidden
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                    visible
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedField ? (
                        <div className="rounded-2xl border bg-white p-4 shadow-sm">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                Field Details
                              </h4>
                              <p className="text-xs text-gray-500">
                                Edit the selected field here
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  moveFieldUp(selectedSectionIndex, selectedFieldIndex)
                                }
                                className="rounded-lg border px-3 py-2 text-xs text-gray-700"
                              >
                                Up
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  moveFieldDown(selectedSectionIndex, selectedFieldIndex)
                                }
                                className="rounded-lg border px-3 py-2 text-xs text-gray-700"
                              >
                                Down
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  duplicateField(
                                    selectedSectionIndex,
                                    selectedFieldIndex
                                  )
                                }
                                className="rounded-lg border px-3 py-2 text-xs text-gray-700"
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeField(
                                    selectedSectionIndex,
                                    selectedFieldIndex
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Field Label
                              </label>
                              <input
                                value={selectedField.label}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    label: e.target.value,
                                    key: slugify(e.target.value || "field"),
                                  })
                                }
                                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Field Key
                              </label>
                              <input
                                value={selectedField.key}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    key: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Field Type
                              </label>
                              <select
                                value={selectedField.type}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    type: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                              >
                                <option value="text">text</option>
                                <option value="email">email</option>
                                <option value="tel">tel</option>
                                <option value="number">number</option>
                                <option value="date">date</option>
                                <option value="textarea">textarea</option>
                                <option value="select">select</option>
                                <option value="radio">radio</option>
                                <option value="checkbox">checkbox</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Field Width
                              </label>
                              <select
                                value={selectedField.width ?? "full"}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    width: e.target.value as
                                      | "full"
                                      | "half"
                                      | "third"
                                      | "quarter",
                                  })
                                }
                                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                              >
                                <option value="full">full</option>
                                <option value="half">half</option>
                                <option value="third">third</option>
                                <option value="quarter">quarter</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Placeholder
                            </label>
                            <input
                              value={selectedField.placeholder ?? ""}
                              onChange={(e) =>
                                updateField(selectedSectionIndex, selectedFieldIndex, {
                                  placeholder: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border px-3 py-2.5 text-sm"
                            />
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={Boolean(selectedField.required)}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    required: e.target.checked,
                                  })
                                }
                              />
                              Required field
                            </label>

                            <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={selectedField.visible !== false}
                                onChange={(e) =>
                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    visible: e.target.checked,
                                  })
                                }
                              />
                              Visible field
                            </label>
                          </div>

                          {(selectedField.type === "select" ||
                            selectedField.type === "radio") ? (
                            <div className="mt-4">
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Options (one per line as label:value)
                              </label>
                              <textarea
                                value={(selectedField.options ?? [])
                                  .map((option) => `${option.label}:${option.value}`)
                                  .join("\n")}
                                onChange={(e) => {
                                  const options = e.target.value
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line) => {
                                      const [label, value] = line.split(":");
                                      const finalLabel = (label ?? "").trim();
                                      const finalValue = (value ?? label ?? "").trim();
                                      return {
                                        label: finalLabel,
                                        value: finalValue,
                                      };
                                    });

                                  updateField(selectedSectionIndex, selectedFieldIndex, {
                                    options,
                                  });
                                }}
                                rows={4}
                                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                                placeholder={"Student Visa:student_visa\nVisitor Visa:visitor_visa"}
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
            <p className="mt-1 text-sm text-gray-600">
              Test the form here while customizing it.
            </p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-5">
            <h3 className="text-xl font-bold text-gray-900">
              {title || "Untitled Form"}
            </h3>

            {description ? (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            ) : null}

            <div className="mt-6 space-y-6">
              {schema.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-white px-4 py-10 text-center text-sm text-gray-500">
                  Your preview will appear here once you add sections and fields.
                </div>
              ) : (
                schema.map((section, index) => (
                  <div
                    key={`${section.key}-${index}`}
                    className="rounded-xl border bg-white shadow-sm"
                  >
                    <div className="border-b px-6 py-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {section.title}
                      </h4>
                      {section.description ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {section.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-12">
                      {section.fields
                        .filter((field) => field.visible !== false)
                        .map((field, fieldIndex) => {
                          const value = previewValues[field.key] ?? "";
                          const isTextarea = field.type === "textarea";
                          const isSelect = field.type === "select";
                          const isRadio = field.type === "radio";
                          const isCheckbox = field.type === "checkbox";

                          return (
                            <div
                              key={`${field.key}-${fieldIndex}`}
                              className={getWidthClass(field.width)}
                            >
                              {!isCheckbox ? (
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                  {field.label || "Untitled Field"}
                                  {field.required ? (
                                    <span className="ml-1 text-red-500">*</span>
                                  ) : null}
                                </label>
                              ) : null}

                              {isTextarea ? (
                                <textarea
                                  value={value}
                                  onChange={(e) =>
                                    setPreviewValues((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={field.placeholder}
                                  rows={4}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                                />
                              ) : isSelect ? (
                                <select
                                  value={value}
                                  onChange={(e) =>
                                    setPreviewValues((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                                >
                                  <option value="">Select</option>
                                  {field.options?.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : isRadio ? (
                                <div className="flex flex-wrap gap-4">
                                  {field.options?.map((option) => (
                                    <label
                                      key={option.value}
                                      className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                      <input
                                        type="radio"
                                        name={field.key}
                                        value={option.value}
                                        checked={value === option.value}
                                        onChange={(e) =>
                                          setPreviewValues((prev) => ({
                                            ...prev,
                                            [field.key]: e.target.value,
                                          }))
                                        }
                                      />
                                      {option.label}
                                    </label>
                                  ))}
                                </div>
                              ) : isCheckbox ? (
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={value === "true"}
                                    onChange={(e) =>
                                      setPreviewValues((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.checked
                                          ? "true"
                                          : "false",
                                      }))
                                    }
                                  />
                                  {field.label}
                                </label>
                              ) : (
                                <input
                                  type={field.type === "radio" ? "text" : field.type}
                                  value={value}
                                  onChange={(e) =>
                                    setPreviewValues((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {schema.length > 0 ? (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
                >
                  {submitButtonText || "Submit"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}