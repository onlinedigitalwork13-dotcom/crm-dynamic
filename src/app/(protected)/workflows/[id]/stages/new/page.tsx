"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewWorkflowStagePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workflowId = params.id;

  const [form, setForm] = useState({
    stageName: "",
    orderSequence: 1,
    isFinal: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.stageName.trim()) {
      setError("Stage name is required.");
      return;
    }

    if (!form.orderSequence || form.orderSequence < 1) {
      setError("Order sequence must be 1 or greater.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/workflows/${workflowId}/stages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stageName: form.stageName.trim(),
          orderSequence: form.orderSequence,
          isFinal: form.isFinal,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create stage");
        setLoading(false);
        return;
      }

      router.push(`/workflows/${workflowId}`);
      router.refresh();
    } catch {
      setError("Something went wrong while creating the stage.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Settings / Workflows / Stages / New
            </p>
            <h1 className="text-2xl font-bold">Add Workflow Stage</h1>
            <p className="mt-2 text-sm text-gray-600">
              Add a new stage to define the order and structure of this workflow.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/settings"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Settings
            </Link>
            <Link
              href={`/workflows/${workflowId}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Workflow
            </Link>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Stage Name *
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            value={form.stageName}
            onChange={(e) => setForm({ ...form, stageName: e.target.value })}
            placeholder="Application Submitted"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Order Sequence *
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            value={form.orderSequence}
            onChange={(e) =>
              setForm({
                ...form,
                orderSequence: Number(e.target.value),
              })
            }
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear earlier in the workflow.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              id="isFinal"
              type="checkbox"
              checked={form.isFinal}
              onChange={(e) =>
                setForm({ ...form, isFinal: e.target.checked })
              }
            />
            Final Stage
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Stage"}
          </button>

          <Link
            href={`/workflows/${workflowId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}