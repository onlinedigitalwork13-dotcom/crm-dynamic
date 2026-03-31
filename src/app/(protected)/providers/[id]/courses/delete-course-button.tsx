"use client";

type Props = {
  courseId: string;
  providerId: string;
};

export default function DeleteCourseButton({ courseId, providerId }: Props) {
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to delete course");
        return;
      }

      window.location.href = `/providers/${providerId}/courses`;
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the course");
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