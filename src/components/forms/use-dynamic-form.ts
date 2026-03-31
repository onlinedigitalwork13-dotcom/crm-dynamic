"use client";

import { useMemo, useState } from "react";
import { FormSchema } from "./form-types";

function buildInitialValues(schema: FormSchema) {
  const initialValues: Record<string, string> = {};

  for (const section of schema) {
    for (const field of section.fields) {
      initialValues[field.key] = field.defaultValue ?? "";
    }
  }

  return initialValues;
}

export function useDynamicForm(
  schema: FormSchema,
  initialOverrides?: Record<string, string>
) {
  const initialValues = useMemo(() => {
    return {
      ...buildInitialValues(schema),
      ...(initialOverrides ?? {}),
    };
  }, [schema, initialOverrides]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetValues = () => {
    setValues(initialValues);
  };

  const setAllValues = (nextValues: Record<string, string>) => {
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