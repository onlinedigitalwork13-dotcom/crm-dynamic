type RawField = {
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  width?: "full" | "half" | "third" | "quarter";
  options?: Array<{ label?: string; value?: string } | string>;
  visible?: boolean;
};

type RawSection = {
  key?: string;
  title?: string;
  description?: string;
  fields?: RawField[];
};

export type NormalizedField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  width?: "full" | "half" | "third" | "quarter";
  options?: Array<{ label: string; value: string }>;
  visible?: boolean;
};

export type NormalizedSection = {
  key: string;
  title: string;
  description?: string;
  fields: NormalizedField[];
};

function normalizeOptions(
  options: RawField["options"]
): Array<{ label: string; value: string }> | undefined {
  if (!Array.isArray(options) || options.length === 0) return undefined;

  return options
    .map((option) => {
      if (typeof option === "string") {
        const value = option.trim();
        if (!value) return null;

        return { label: value, value };
      }

      if (typeof option === "object" && option !== null) {
        const label = typeof option.label === "string" ? option.label.trim() : "";
        const value = typeof option.value === "string" ? option.value.trim() : "";

        const finalLabel = label || value;
        const finalValue = value || label;

        if (!finalLabel || !finalValue) return null;

        return { label: finalLabel, value: finalValue };
      }

      return null;
    })
    .filter((opt): opt is { label: string; value: string } => Boolean(opt));
}

function normalizeField(field: RawField, index: number): NormalizedField | null {
  const key = field.key?.trim() || `field_${index + 1}`;
  const label = field.label?.trim() || "Untitled Field";
  const type = field.type?.trim() || "text";

  return {
    key,
    label,
    type,
    required: Boolean(field.required),
    placeholder: field.placeholder?.trim() || undefined,
    width: field.width || "full",
    options: normalizeOptions(field.options),
    visible: field.visible !== false,
  };
}

export function normalizeFormSchema(value: unknown): NormalizedSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((section, sectionIndex) => {
      if (!section || typeof section !== "object") return null;

      const raw = section as RawSection;

      const key = raw.key?.trim() || `section_${sectionIndex + 1}`;
      const title = raw.title?.trim() || `Section ${sectionIndex + 1}`;
      const description = raw.description?.trim() || undefined;

      const fields = Array.isArray(raw.fields)
        ? raw.fields
            .map((f, i) => normalizeField(f, i))
            .filter((f): f is NormalizedField => Boolean(f))
        : [];

      return {
        key,
        title,
        description,
        fields,
      };
    })
    .filter(Boolean) as NormalizedSection[];
}