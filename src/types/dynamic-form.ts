export type DynamicFormFieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "number"
  | "date"
  | "checkbox";

export type DynamicFormField = {
  id: string;
  label: string;
  type: DynamicFormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
  section?: string;
  defaultValue?: string | boolean | number | null;
};

export type DynamicFormSchema = DynamicFormField[];