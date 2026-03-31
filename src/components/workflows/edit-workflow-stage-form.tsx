"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EditWorkflowStageFormProps = {
  workflowId: string;
  stageId: string;
  initialStageName: string;
  initialOrderSequence: number;
  initialIsFinal: boolean;
};

export default function EditWorkflowStageForm({
  workflowId,
  stageId,
  initialStageName,
  initialOrderSequence,
  initialIsFinal,
}: EditWorkflowStageFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    stageName: initialStageName,
    orderSequence: initialOrderSequence,
    isFinal: initialIsFinal,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/workflow-stages/${stageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stageName: form.stageName,
          orderSequence: Number(form.orderSequence),
          isFinal: form.isFinal,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update workflow stage");
        setLoading(false);
        return;
      }

      router.push(`/workflows/${workflowId}`);
      router.refresh();
    } catch (error) {
      console.error("Update workflow stage error:", error);
      setError("Something went wrong while updating the stage");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="stageName"
          className="block text-sm font-medium text-gray-700"
        >
          Stage Name
        </label>
        <input
          id="stageName"
          type="text"
          value={form.stageName}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              stageName: e.target.value,
            }))
          }
          placeholder="e.g. Offer Issued"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none ring-0 transition focus:border-black"
          required
        />
        <p className="text-xs text-gray-500">
          Use a short, clear name that describes this step in the workflow.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="orderSequence"
          className="block text-sm font-medium text-gray-700"
        >
          Stage Order
        </label>
        <input
          id="orderSequence"
          type="number"
          min={1}
          value={form.orderSequence}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              orderSequence: Number(e.target.value),
            }))
          }
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none ring-0 transition focus:border-black"
          required
        />
        <p className="text-xs text-gray-500">
          Lower numbers appear earlier in the workflow. Each stage should use a unique order number.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.isFinal}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isFinal: e.target.checked,
              }))
            }
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Mark as final stage</p>
            <p className="mt-1 text-xs text-gray-500">
              Final stages usually represent the last step in the workflow. If selected,
              other final stages in this workflow will be unset automatically.
            </p>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <Link
          href={`/workflows/${workflowId}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}