"use client";

type Props = {
  clientId: string;
};

export default function DeleteClientButton({ clientId }: Props) {
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
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
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete Client
    </button>
  );
}