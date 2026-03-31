import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function prettyAction(action: string) {
  return action
    .split(".")
    .join(" → ")
    .replace(/_/g, " ");
}

export default async function AuditLogsPage() {
  const session = await requireAuth();

  if (!isAdmin(session.user.roleName)) {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      message: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review important system activity across clients, applications, and tasks.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Metadata</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      {log.actorUser ? (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {`${log.actorUser.firstName} ${log.actorUser.lastName}`.trim()}
                          </div>
                          <div className="text-xs text-gray-500">{log.actorUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">System</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {prettyAction(log.action)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-medium capitalize text-gray-900">{log.entityType}</div>
                        <div className="font-mono text-xs text-gray-500">{log.entityId}</div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {log.message || <span className="text-gray-400">No message</span>}
                    </td>

                    <td className="px-4 py-4">
                      {log.metadata ? (
                        <pre className="max-w-[360px] overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}