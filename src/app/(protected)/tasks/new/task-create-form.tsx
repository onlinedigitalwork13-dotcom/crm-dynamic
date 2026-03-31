"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function TaskCreateForm({
  users,
  clients,
}: {
  users: User[];
  clients: Client[];
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    clientId: "",
    dueDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to create task");
      return;
    }

    router.push("/tasks");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Task Title</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Assign To</label>
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={form.assignedToId}
          onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
          required
        >
          <option value="">Select staff</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Client</label>
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          <option value="">No client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Due Date</label>
        <input
          type="date"
          className="w-full rounded-lg border px-3 py-2"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Task"}
      </button>
    </form>
  );
}