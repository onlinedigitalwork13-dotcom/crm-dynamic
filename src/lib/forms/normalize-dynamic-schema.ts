import {
  FormField,
  FormFieldOption,
  FormSchema,
  FormSection,
} from "@/components/forms/form-types";

function normalizeOption(value: unknown): FormFieldOption | null {
  if (typeof value !== "object" || value === null) return null;

  const raw = value as Record<string, unknown>;

  if (typeof raw.label !== "string" || typeof raw.value !== "string") {
    return null;
  }

  return {
    label: raw.label,
    value: raw.value,
  };
}

function normalizeField(value: unknown): FormField | null {
  if (typeof value !== "object" || value === null) return null;

  const raw = value as Record<string, unknown>;

  if (
    typeof raw.key !== "string" ||
    typeof raw.label !== "string" ||
    typeof raw.type !== "string"
  ) {
    return null;
  }

  const width =
    raw.width === "full" ||
    raw.width === "half" ||
    raw.width === "third" ||
    raw.width === "quarter"
      ? raw.width
      : "full";

  return {
    key: raw.key,
    label: raw.label,
    type: raw.type as FormField["type"],
    required: Boolean(raw.required),
    placeholder:
      typeof raw.placeholder === "string" ? raw.placeholder : undefined,
    width,
    visible: raw.visible !== false,
    options: Array.isArray(raw.options)
      ? raw.options
          .map(normalizeOption)
          .filter((option): option is FormFieldOption => option !== null)
      : undefined,
  };
}

function normalizeSection(value: unknown): FormSection | null {
  if (typeof value !== "object" || value === null) return null;

  const raw = value as Record<string, unknown>;

  if (
    typeof raw.key !== "string" ||
    typeof raw.title !== "string" ||
    !Array.isArray(raw.fields)
  ) {
    return null;
  }

  return {
    key: raw.key,
    title: raw.title,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    fields: raw.fields
      .map(normalizeField)
      .filter((field): field is FormField => field !== null),
  };
}

export function normalizeFormSchema(input: unknown): FormSchema {
  if (!Array.isArray(input)) return [];

  return input
    .map(normalizeSection)
    .filter((section): section is FormSection => section !== null);
}