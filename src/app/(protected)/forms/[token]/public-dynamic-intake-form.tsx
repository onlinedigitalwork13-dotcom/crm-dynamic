"use client";

import { FormEvent, useMemo, useState } from "react";
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

function getVisibleSectionCount(schema: FormSchema) {
  return schema.filter((section) =>
    section.fields.some((field) => field.visible !== false)
  ).length;
}

function getVisibleFieldCount(schema: FormSchema) {
  return schema.reduce(
    (sum, section) =>
      sum + section.fields.filter((field) => field.visible !== false).length,
    0
  );
}

export default function PublicDynamicIntakeForm({ form, schema }: Props) {
  const { values, setValue, resetValues } = useDynamicForm(schema);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{
    message?: string;
    matchedExistingClient?: boolean;
  } | null>(null);

  const visibleSectionCount = useMemo(
    () => getVisibleSectionCount(schema),
    [schema]
  );

  const visibleFieldCount = useMemo(
    () => getVisibleFieldCount(schema),
    [schema]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      for (const section of schema) {
        for (const field of section.fields) {
          if (field.visible === false) continue;

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

      const data = await response.json();

      setSuccessPayload({
        message:
          typeof data?.message === "string" ? data.message : undefined,
        matchedExistingClient: Boolean(data?.matchedExistingClient),
      });

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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-950 via-gray-900 to-black px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-300">
                  Secure Intake Form
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  {form.title}
                </h1>
                {form.description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">
                    {form.description}
                  </p>
                ) : (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">
                    Please complete the details below carefully. Once submitted,
                    your request will be reviewed by our team and processed in
                    the next workflow stage.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-wide text-gray-300">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {form.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-wide text-gray-300">
                    Sections
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {visibleSectionCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm col-span-2 sm:col-span-1">
                  <p className="text-[11px] uppercase tracking-wide text-gray-300">
                    Fields
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {visibleFieldCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {submitSuccess ? (
                <div className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-green-900">
                        Submission Successful
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-green-800">
                        {successPayload?.message ||
                          form.successMessage ||
                          "Thank you. Your form has been submitted successfully."}
                      </p>

                      {successPayload?.matchedExistingClient ? (
                        <div className="mt-4 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm text-green-900">
                          We found an existing student profile and linked this
                          submission to it so your next application can continue
                          under the same profile.
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitSuccess(false);
                            setSuccessPayload(null);
                            setSubmitError(null);
                          }}
                          className="rounded-xl border border-green-300 bg-white px-4 py-2.5 text-sm font-medium text-green-800 hover:bg-green-50"
                        >
                          Submit another response
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    {schema.length === 0 ? (
                      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
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
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        resetValues();
                        setSubmitError(null);
                      }}
                      disabled={submitting || schema.length === 0}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={submitting || schema.length === 0}
                      className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Submitting..."
                        : form.submitButtonText || "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Before you submit
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                  <p>
                    Please make sure all details are accurate before sending the
                    form.
                  </p>
                  <p>
                    Use the same student contact details if the student already
                    has an existing profile. This helps avoid duplicate records.
                  </p>
                  <p>
                    For new applications under an existing student, include the
                    latest course, intake, and application details.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Submission details
                </h2>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500">Form token</dt>
                    <dd className="break-all text-right font-medium text-gray-900">
                      {form.token}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500">Form status</dt>
                    <dd className="font-medium text-gray-900">{form.status}</dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500">Visibility</dt>
                    <dd className="font-medium text-gray-900">
                      {form.isActive ? "Open for submission" : "Unavailable"}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500">Visible sections</dt>
                    <dd className="font-medium text-gray-900">
                      {visibleSectionCount}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500">Visible fields</dt>
                    <dd className="font-medium text-gray-900">
                      {visibleFieldCount}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Privacy note
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  This form is designed to collect only the information required
                  for intake and application processing. It does not expose
                  internal staff or subagent lists publicly.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}