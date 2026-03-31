"use client";

import { FormField, FormSchema } from "./form-types";

type DynamicFormRendererProps = {
  schema: FormSchema;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
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

export default function DynamicFormRenderer({
  schema,
  values,
  onChange,
}: DynamicFormRendererProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {schema.map((section) => (
        <section
          key={section.key}
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h2>

            {section.description ? (
              <p className="mt-1 text-sm text-gray-500">
                {section.description}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-12">
            {section.fields
              .filter((field) => field.visible !== false)
              .map((field) => {
                const value = values[field.key] ?? "";
                const isTextarea = field.type === "textarea";
                const isRadio = field.type === "radio";
                const isCheckbox = field.type === "checkbox";
                const isSelect = field.type === "select";

                return (
                  <div key={field.key} className={getWidthClass(field)}>
                    {!isCheckbox ? (
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required ? (
                          <span className="ml-1 text-red-500">*</span>
                        ) : null}
                      </label>
                    ) : null}

                    {isTextarea ? (
                      <textarea
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                      />
                    ) : isSelect ? (
                      <select
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                      >
                        <option value="">Select</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
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
                              onChange={(e) => onChange(field.key, e.target.value)}
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
                            onChange(field.key, e.target.checked ? "true" : "false")
                          }
                        />
                        {field.label}
                      </label>
                    ) : (
                      <input
                        type={field.type}
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
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