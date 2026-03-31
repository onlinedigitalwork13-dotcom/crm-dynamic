"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type WorkflowStage = {
  id: string;
  workflowId: string;
  stageName: string;
  orderSequence: number;
  isFinal: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type WorkflowStagesListProps = {
  workflowId: string;
  stages: WorkflowStage[];
};

function reorderStages<T>(items: T[], fromIndex: number, toIndex: number) {
  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}

export default function WorkflowStagesList({
  workflowId,
  stages,
}: WorkflowStagesListProps) {
  const router = useRouter();
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const orderedStages = useMemo(
    () =>
      [...stages].sort((a, b) => {
        if (a.orderSequence !== b.orderSequence) {
          return a.orderSequence - b.orderSequence;
        }

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    [stages]
  );

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= orderedStages.length) return;

    setError("");
    setLoadingStageId(orderedStages[fromIndex].id);

    try {
      const reordered = reorderStages(orderedStages, fromIndex, toIndex);
      const stageIds = reordered.map((stage) => stage.id);

      const res = await fetch(`/api/workflows/${workflowId}/stages/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stageIds }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to reorder workflow stages");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Reorder stages error:", error);
      setError("Something went wrong while reordering stages");
    } finally {
      setLoadingStageId(null);
    }
  }

  async function handleDelete(stageId: string, stageName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the stage "${stageName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setLoadingStageId(stageId);

    try {
      const res = await fetch(`/api/workflow-stages/${stageId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to delete workflow stage");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete stage error:", error);
      setError("Something went wrong while deleting the stage");
    } finally {
      setLoadingStageId(null);
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">Workflow Stages</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage the ordered stages used in this workflow pipeline.
        </p>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        {orderedStages.map((stage, index) => {
          const isLoading = loadingStageId === stage.id;

          return (
            <div
              key={stage.id}
              className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{stage.stageName}</p>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    order {stage.orderSequence}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      stage.isFinal
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {stage.isFinal ? "final stage" : "normal stage"}
                  </span>

                  {isLoading ? (
                    <span className="text-xs text-gray-500">Updating...</span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Position {index + 1} of {orderedStages.length}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleReorder(index, index - 1)}
                  disabled={index === 0 || !!loadingStageId}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↑ Up
                </button>

                <button
                  type="button"
                  onClick={() => handleReorder(index, index + 1)}
                  disabled={index === orderedStages.length - 1 || !!loadingStageId}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↓ Down
                </button>

                <Link
                  href={`/workflows/${workflowId}/stages/${stage.id}/edit`}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Edit Stage
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(stage.id, stage.stageName)}
                  disabled={!!loadingStageId}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}