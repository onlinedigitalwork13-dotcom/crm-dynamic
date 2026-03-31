"use client";

import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { clientMasterSchema } from "@/components/forms/client-master-schema";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";

export default function FormsPage() {
  const { values, setValue, resetValues } = useDynamicForm(clientMasterSchema);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Preview</h1>
            <p className="mt-1 text-sm text-gray-600">
              Reusable master form preview for clients, check-in, and intake.
            </p>
          </div>

          <button
            type="button"
            onClick={resetValues}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Reset Form
          </button>
        </div>

        <DynamicFormRenderer
          schema={clientMasterSchema}
          values={values}
          onChange={setValue}
        />
      </div>
    </div>
  );
}