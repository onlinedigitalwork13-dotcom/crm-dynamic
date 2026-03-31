"use client";

import { useMemo, useState } from "react";
import { DynamicFormSchema } from "@/types/dynamic-form";

export type DynamicFormValues = Record<string, string | boolean>;

function buildInitialValues(schema: DynamicFormSchema): DynamicFormValues {
  const initialValues: DynamicFormValues = {};

  for (const field of schema) {
    if (field.type === "checkbox") {
      initialValues[field.id] =
        typeof field.defaultValue === "boolean" ? field.defaultValue : false;
    } else {
      initialValues[field.id] =
        field.defaultValue == null ? "" : String(field.defaultValue);
    }
  }

  return initialValues;
}

export function useDbDynamicForm(schema: DynamicFormSchema) {
  const initialValues = useMemo(() => buildInitialValues(schema), [schema]);

  const [values, setValues] = useState<DynamicFormValues>(initialValues);

  function setValue(fieldId: string, value: string | boolean) {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function setAllValues(nextValues: Record<string, string | boolean>) {
    setValues((prev) => ({
      ...prev,
      ...nextValues,
    }));
  }

  function resetValues() {
    setValues(initialValues);
  }

  return {
    values,
    setValue,
    setAllValues,
    resetValues,
  };
}