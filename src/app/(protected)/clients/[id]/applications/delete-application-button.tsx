"use client";

type Props = {
  applicationId: string;
  clientId: string;
};

export default function DeleteApplicationButton({
  applicationId,
  clientId,
}: Props) {
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to delete application");
        return;
      }

      window.location.href = `/clients/${clientId}/applications`;
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the application");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}