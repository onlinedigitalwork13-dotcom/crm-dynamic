export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox";

export type FormFieldWidth = "full" | "half" | "third" | "quarter";

export type FormFieldVariant = "inline" | "stacked";

export type FormSectionLayout = "paper" | "default";

export type FormField = {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  width?: FormFieldWidth;
  visible?: boolean;
  options?: FormFieldOption[];
  variant?: FormFieldVariant;
};

export type FormSection = {
  key: string;
  title: string;
  description?: string;
  layout?: FormSectionLayout;
  fields: FormField[];
};

export type FormSchema = FormSection[];