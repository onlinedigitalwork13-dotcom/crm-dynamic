"use client";

import { DynamicFormSchema, DynamicFormField } from "@/types/dynamic-form";

type Props = {
  schema: DynamicFormSchema;
  values: Record<string, string | boolean>;
  onChange: (fieldId: string, value: string | boolean) => void;
};

export default function PublicDynamicFormRenderer({
  schema,
  values,
  onChange,
}: Props) {
  function renderField(field: DynamicFormField, index: number) {
    const label = (
      <label
        htmlFor={field.id}
        className="mb-2 block text-sm font-medium text-gray-800"
      >
        {field.label}
        {field.required ? " *" : ""}
      </label>
    );

    if (field.type === "textarea") {
      return (
        <div key={`${field.id}-${index}`}>
          {label}
          <textarea
            id={field.id}
            name={field.id}
            rows={4}
            required={field.required}
            value={String(values[field.id] ?? "")}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={`${field.id}-${index}`}>
          {label}
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            value={String(values[field.id] ?? "")}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, optionIndex) => (
              <option key={`${field.id}-option-${optionIndex}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div
          key={`${field.id}-${index}`}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <input
            id={field.id}
            name={field.id}
            type="checkbox"
            checked={Boolean(values[field.id])}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <label htmlFor={field.id} className="text-sm text-gray-800">
            {field.label}
            {field.required ? " *" : ""}
          </label>
        </div>
      );
    }

    const inputType =
      field.type === "email" || field.type === "number" || field.type === "date"
        ? field.type
        : "text";

    return (
      <div key={`${field.id}-${index}`}>
        {label}
        <input
          id={field.id}
          name={field.id}
          type={inputType}
          required={field.required}
          value={String(values[field.id] ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || ""}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {schema.map((field, index) => renderField(field, index))}
    </div>
  );
}