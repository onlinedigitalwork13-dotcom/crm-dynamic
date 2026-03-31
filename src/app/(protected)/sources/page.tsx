import Link from "next/link";
import { getLeadSources } from "@/lib/source-service";
import { requireRole } from "@/lib/require-role";

export default async function SourcesPage() {
  await requireRole(["admin", "super admin", "super_admin"]);

  const sources = await getLeadSources();

  const activeCount = sources.filter((source) => source.isActive).length;
  const inactiveCount = sources.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Settings / Lead Sources</p>
            <h1 className="text-2xl font-bold">Lead Sources</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage lead source records used when creating and tracking clients.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/settings"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Settings
            </Link>
            <Link
              href="/sources/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Add Source
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard label="Total Sources" value={String(sources.length)} />
          <InfoCard label="Active Sources" value={String(activeCount)} />
          <InfoCard label="Inactive Sources" value={String(inactiveCount)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {sources.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              No lead sources found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Add your first lead source to organize intake origins.
            </p>
            <div className="mt-4">
              <Link
                href="/sources/new"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Add Source
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{source.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        source.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {source.isActive ? "active" : "inactive"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {source.description || "No description"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/sources/${source.id}/edit`}
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}