"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteBranchButtonProps = {
  branchId: string;
  branchName: string;
  disabled?: boolean;
  disabledReason?: string;
};

type DeleteApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function DeleteBranchButton({
  branchId,
  branchName,
  disabled = false,
  disabledReason,
}: DeleteBranchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (disabled || loading) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${branchName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      });

      const contentType = response.headers.get("content-type") || "";
      let data: DeleteApiResponse | null = null;

      if (contentType.includes("application/json")) {
        data = (await response.json()) as DeleteApiResponse;
      } else {
        const text = await response.text();
        throw new Error(text || "Unexpected server response.");
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to delete branch.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || loading}
        title={disabled ? disabledReason : "Delete branch"}
        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {disabled && disabledReason ? (
        <p className="max-w-[180px] text-[11px] leading-4 text-slate-400">
          {disabledReason}
        </p>
      ) : null}

      {error ? (
        <p className="max-w-[220px] text-[11px] leading-4 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}