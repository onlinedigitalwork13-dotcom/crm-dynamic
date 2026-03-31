import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { getAssignedToMe, getAssignedByMe } from "@/lib/task-service";

export default async function TasksPage() {
  const session = await requireAuth();

  const currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email ?? undefined,
    },
  });

  if (!currentUser) {
    return (
      <div className="p-6 text-sm text-red-600">
        Logged-in user not found in database.
      </div>
    );
  }

  const assignedToMe = await getAssignedToMe(currentUser.id);
  const assignedByMe = await getAssignedByMe(currentUser.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500">
            Track your assigned and created tasks
          </p>
        </div>

        <Link
          href="/tasks/new"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Add Task
        </Link>
      </div>

      {/* ASSIGNED TO ME */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Assigned to Me</h2>

        <div className="overflow-hidden rounded-xl border bg-white">
          {assignedToMe.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No tasks assigned to you.
            </div>
          ) : (
            <div className="divide-y">
              {assignedToMe.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.description || "No description"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Client:{" "}
                      {task.client
                        ? `${task.client.firstName} ${task.client.lastName}`
                        : "No client linked"}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      Assigned By: {task.assignedBy.firstName}{" "}
                      {task.assignedBy.lastName}
                    </p>
                    <p>Status: {task.status}</p>
                    <p>
                      Due:{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>

                    <form
                      action={`/api/tasks/${task.id}/status`}
                      method="post"
                      className="mt-2 flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={task.status}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button
                        type="submit"
                        className="rounded bg-black px-3 py-1 text-sm text-white"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ASSIGNED BY ME */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Assigned by Me</h2>

        <div className="overflow-hidden rounded-xl border bg-white">
          {assignedByMe.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              You have not assigned any tasks yet.
            </div>
          ) : (
            <div className="divide-y">
              {assignedByMe.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.description || "No description"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Client:{" "}
                      {task.client
                        ? `${task.client.firstName} ${task.client.lastName}`
                        : "No client linked"}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      Assigned To: {task.assignedTo.firstName}{" "}
                      {task.assignedTo.lastName}
                    </p>
                    <p>Status: {task.status}</p>
                    <p>
                      Due:{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>

                    <form
                      action={`/api/tasks/${task.id}/status`}
                      method="post"
                      className="mt-2 flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={task.status}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button
                        type="submit"
                        className="rounded bg-black px-3 py-1 text-sm text-white"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}