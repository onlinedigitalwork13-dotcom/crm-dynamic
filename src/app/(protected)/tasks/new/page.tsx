import { prisma } from "@/lib/prisma";
import TaskCreateForm from "./task-create-form";

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { firstName: "asc" },
  });

  const clients = await prisma.client.findMany({
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add Task</h1>
      <TaskCreateForm users={users} clients={clients} />
    </div>
  );
}