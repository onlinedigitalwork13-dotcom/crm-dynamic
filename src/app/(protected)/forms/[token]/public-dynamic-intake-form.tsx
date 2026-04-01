"use client";

import { FormEvent, useState } from "react";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { FormSchema } from "@/components/forms/form-types";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";

type PublicFormData = {
  id: string;
  token: string;
  title: string;
  description: string | null;
  status: string;
  isActive: boolean;
  submitButtonText: string | null;
  successMessage: string | null;
};

type Props = {
  form: PublicFormData;
  schema: FormSchema;
};

function toFormDataValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export default function PublicDynamicIntakeForm({ form, schema }: Props) {
  const { values, setValue, resetValues } = useDynamicForm(schema);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      for (const section of schema) {
        for (const field of section.fields) {
          const value = values[field.key];

          if (field.type === "checkbox") {
            if (value === true || value === "true") {
              formData.append(field.key, "on");
            }
            continue;
          }

          formData.append(field.key, toFormDataValue(value));
        }
      }

      const response = await fetch(`/api/forms/${form.token}`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData?.details?.[0] ||
              errorData?.error ||
              "Failed to submit form"
          );
        }

        const text = await response.text();
        throw new Error(text || "Failed to submit form");
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Unexpected server response");
      }

      await response.json();

      setSubmitSuccess(true);
      resetValues();
    } catch (error) {
      console.error("Public form submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Intake Form</p>
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          {form.description ? (
            <p className="mt-2 text-sm text-gray-600">{form.description}</p>
          ) : null}
        </div>

        {submitSuccess ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <h2 className="text-lg font-semibold text-green-800">
              Submission Successful
            </h2>
            <p className="mt-2 text-sm text-green-700">
              {form.successMessage ||
                "Thank you. Your form has been submitted successfully."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              {schema.length === 0 ? (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  This form has no fields configured yet.
                </div>
              ) : (
                <DynamicFormRenderer
                  schema={schema}
                  values={values}
                  onChange={setValue}
                />
              )}
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || schema.length === 0}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : form.submitButtonText || "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}