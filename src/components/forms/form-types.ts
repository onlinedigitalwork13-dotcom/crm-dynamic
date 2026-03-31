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

export type FormField = {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  width?: FormFieldWidth;
  visible?: boolean;
  options?: FormFieldOption[];
};

export type FormSection = {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type FormSchema = FormSection[];