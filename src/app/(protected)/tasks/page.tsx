import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { getAssignedToMe, getAssignedByMe } from "@/lib/task-service";
import {
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react";

function MetricCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base = "px-2 py-1 rounded-full text-xs font-medium";

  if (status === "completed")
    return <span className={`${base} bg-green-100 text-green-700`}>Completed</span>;
  if (status === "in_progress")
    return <span className={`${base} bg-blue-100 text-blue-700`}>In Progress</span>;

  return <span className={`${base} bg-gray-100 text-gray-600`}>Pending</span>;
}

function TaskCard({ task, type }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{task.title}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {task.description || "No description"}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Client:{" "}
            {task.client
              ? `${task.client.firstName} ${task.client.lastName}`
              : "No client"}
          </p>
        </div>

        <StatusBadge status={task.status} />
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
        <p>
          {type === "assignedTo"
            ? `Assigned By: ${task.assignedBy.firstName} ${task.assignedBy.lastName}`
            : `Assigned To: ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
        </p>

        <p>
          Due:{" "}
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString()
            : "No due date"}
        </p>
      </div>

      <form
        action={`/api/tasks/${task.id}/status`}
        method="post"
        className="mt-4 flex gap-2"
      >
        <select
          name="status"
          defaultValue={task.status}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <button className="rounded-xl bg-black px-4 py-2 text-white text-sm">
          Update
        </button>
      </form>
    </div>
  );
}

export default async function TasksPage() {
  const session = await requireAuth();

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
  });

  if (!currentUser) {
    return (
      <div className="p-6 text-sm text-red-600">
        Logged-in user not found
      </div>
    );
  }

  const assignedToMe = await getAssignedToMe(currentUser.id);
  const assignedByMe = await getAssignedByMe(currentUser.id);

  const totalTasks = assignedToMe.length + assignedByMe.length;
  const completed =
    [...assignedToMe, ...assignedByMe].filter(
      (t) => t.status === "completed"
    ).length;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-black to-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Task Workspace
            </p>
            <h1 className="text-3xl font-bold mt-2">Tasks</h1>
            <p className="text-sm text-gray-300 mt-1">
              Manage your workflow and assignments
            </p>
          </div>

          <Link
            href="/tasks/new"
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Link>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Tasks" value={totalTasks} icon={ListTodo} />
        <MetricCard title="Assigned to Me" value={assignedToMe.length} icon={Clock3} />
        <MetricCard title="Assigned by Me" value={assignedByMe.length} icon={Sparkles} />
        <MetricCard title="Completed" value={completed} icon={CheckCircle2} />
      </div>

      {/* ASSIGNED TO ME */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Assigned to Me</h2>

        {assignedToMe.length === 0 ? (
          <div className="rounded-2xl border p-6 text-center text-gray-500">
            No tasks assigned to you
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignedToMe.map((task) => (
              <TaskCard key={task.id} task={task} type="assignedTo" />
            ))}
          </div>
        )}
      </section>

      {/* ASSIGNED BY ME */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Assigned by Me</h2>

        {assignedByMe.length === 0 ? (
          <div className="rounded-2xl border p-6 text-center text-gray-500">
            You have not assigned any tasks
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignedByMe.map((task) => (
              <TaskCard key={task.id} task={task} type="assignedBy" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}