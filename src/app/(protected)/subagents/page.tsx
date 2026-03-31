import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SubagentsPage() {
  const subagents = await prisma.subagent.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      clients: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subagents</h1>
          <p className="text-sm text-gray-500">
            Manage external subagents working with clients
          </p>
        </div>

        <Link
          href="/subagents/new"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Add Subagent
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 font-medium text-gray-600">
                Active Clients
              </th>
            </tr>
          </thead>

          <tbody>
            {subagents.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No subagents found
                </td>
              </tr>
            ) : (
              subagents.map((subagent) => (
                <tr key={subagent.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{subagent.name}</td>

                  <td className="px-4 py-3 text-gray-600">
                    {subagent.email || "No email"}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {subagent.phone || "No phone"}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {subagent.clients.length}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}