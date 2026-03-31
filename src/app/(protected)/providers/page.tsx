import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export default async function ProvidersPage() {
  await requireAuth();

  const providers = await prisma.provider.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          courses: true,
          applications: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-gray-500">
            Manage universities, colleges, and education partners
          </p>
        </div>

        <Link
          href="/providers/new"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Add Provider
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 font-medium text-gray-600">Country</th>
                <th className="px-4 py-3 font-medium text-gray-600">City</th>
                <th className="px-4 py-3 font-medium text-gray-600">Courses</th>
                <th className="px-4 py-3 font-medium text-gray-600">Applications</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>

            <tbody>
              {providers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No providers found.
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{provider.name}</div>
                      {provider.email && (
                        <div className="text-xs font-normal text-gray-500">
                          {provider.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider.code || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider.country || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider._count.courses}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider._count.applications}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          provider.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/providers/${provider.id}`}
                          className="text-sm font-medium text-black underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/providers/${provider.id}/edit`}
                          className="text-sm font-medium text-blue-600 underline"
                        >
                          Edit
                        </Link>
                      </div>
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