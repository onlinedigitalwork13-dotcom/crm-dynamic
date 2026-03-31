import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CoursesConfigPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
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
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Course Configuration</h1>
            <p className="mt-2 text-sm text-gray-600">
              Select a provider and manage its courses from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/providers"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              View Providers
            </Link>

            <Link
              href="/providers/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Add Provider
            </Link>
          </div>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-600">
            No providers found. Add a provider first to start creating courses.
          </p>

          <div className="mt-4">
            <Link
              href="/providers/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Create First Provider
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{provider.name}</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {[provider.city, provider.country].filter(Boolean).join(", ") || "No location added"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    provider.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {provider.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Courses
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {provider._count.courses}
                  </p>
                </div>

                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Applications
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {provider._count.applications}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/providers/${provider.id}`}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  View
                </Link>

                <Link
                  href={`/providers/${provider.id}/courses`}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Courses
                </Link>

                <Link
                  href={`/providers/${provider.id}/courses/new`}
                  className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
                >
                  Add Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}