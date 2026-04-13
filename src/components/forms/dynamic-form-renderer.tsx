"use client";

import { FormField, FormSchema } from "./form-types";
import type { DynamicFormValue, DynamicFormValues } from "./use-dynamic-form";

type DynamicFormRendererProps = {
  schema: FormSchema;
  values: DynamicFormValues;
  onChange: (key: string, value: DynamicFormValue) => void;
};

function getWidthClass(field: FormField) {
  switch (field.width) {
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

function getStringValue(value: DynamicFormValue | undefined) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getBooleanValue(value: DynamicFormValue | undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  if (typeof value === "number") return value !== 0;
  return false;
}

export default function DynamicFormRenderer({
  schema,
  values,
  onChange,
}: DynamicFormRendererProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {schema.map((section) => (
        <section
          key={section.key}
          className="rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        >
          {/* Section Header */}
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {section.title}
            </h2>

            {section.description ? (
              <p className="mt-1 text-sm text-gray-500">
                {section.description}
              </p>
            ) : null}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
            {section.fields
              .filter((field) => field.visible !== false)
              .map((field) => {
                const rawValue = values[field.key];
                const value = getStringValue(rawValue);
                const checked = getBooleanValue(rawValue);

                const isTextarea = field.type === "textarea";
                const isRadio = field.type === "radio";
                const isCheckbox = field.type === "checkbox";
                const isSelect = field.type === "select";
                const isNumber = field.type === "number";

                return (
                  <div key={field.key} className={getWidthClass(field)}>
                    {!isCheckbox && (
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>
                    )}

                    {/* TEXTAREA */}
                    {isTextarea ? (
                      <textarea
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                      />
                    ) : isSelect ? (
                      /* SELECT */
                      <select
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : isRadio ? (
                      /* RADIO */
                      <div className="flex flex-wrap gap-4">
                        {field.options?.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={field.key}
                              value={option.value}
                              checked={value === option.value}
                              onChange={(e) =>
                                onChange(field.key, e.target.value)
                              }
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    ) : isCheckbox ? (
                      /* CHECKBOX */
                      <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            onChange(field.key, e.target.checked)
                          }
                        />
                        {field.label}
                      </label>
                    ) : (
                      /* INPUT */
                      <input
                        type={field.type}
                        value={value}
                        onChange={(e) =>
                          onChange(
                            field.key,
                            isNumber
                              ? e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                              : e.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}