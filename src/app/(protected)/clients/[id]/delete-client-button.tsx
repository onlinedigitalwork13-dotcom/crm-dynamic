"use client";

import { useState } from "react";

type Props = {
  clientId: string;
};

export default function DeleteClientButton({ clientId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client? This action cannot be undone."
    );

    if (!confirmed || loading) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to delete client");
        return;
      }

      window.location.href = "/clients";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete Client"}
    </button>
  );
}