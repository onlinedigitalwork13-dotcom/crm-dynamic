"use client";

import { useMemo, useState } from "react";
import { FormSchema } from "./form-types";

export type DynamicFormValue = string | number | boolean;
export type DynamicFormValues = Record<string, DynamicFormValue>;

function buildInitialValues(schema: FormSchema): DynamicFormValues {
  const initialValues: DynamicFormValues = {};

  for (const section of schema) {
    for (const field of section.fields) {
      initialValues[field.key] = field.defaultValue ?? "";
    }
  }

  return initialValues;
}

export function useDynamicForm(
  schema: FormSchema,
  initialOverrides?: DynamicFormValues
) {
  const initialValues = useMemo<DynamicFormValues>(() => {
    return {
      ...buildInitialValues(schema),
      ...(initialOverrides ?? {}),
    };
  }, [schema, initialOverrides]);

  const [values, setValues] = useState<DynamicFormValues>(initialValues);

  const setValue = (key: string, value: DynamicFormValue) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetValues = () => {
    setValues(initialValues);
  };

  const setAllValues = (nextValues: DynamicFormValues) => {
    setValues({
      ...buildInitialValues(schema),
      ...nextValues,
    });
  };

  return {
    values,
    setValue,
    resetValues,
    setAllValues,
  };
}