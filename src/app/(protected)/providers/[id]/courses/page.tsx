import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProviderCoursesPage({ params }: PageProps) {
  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      courses: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          courses: true,
          applications: true,
        },
      },
    },
  });

  if (!provider) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{provider.name} Courses</h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  provider.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {provider.isActive ? "Active Provider" : "Inactive Provider"}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Manage all courses linked to this provider
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/providers/${provider.id}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Provider
            </Link>

            <Link
              href={`/providers/${provider.id}/courses/new`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Add Course
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Courses
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {provider._count.courses}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Applications
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {provider._count.applications}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Location
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {[provider.city, provider.country].filter(Boolean).join(", ") || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Course List</h2>
            <p className="mt-1 text-sm text-gray-500">
              All courses created under this provider
            </p>
          </div>
        </div>

        {provider.courses.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">
              No courses found for this provider yet.
            </p>

            <div className="mt-4">
              <Link
                href={`/providers/${provider.id}/courses/new`}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create First Course
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Course</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Level</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Duration</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Campus</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Intakes</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tuition Fee</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>

              <tbody>
                {provider.courses.map((course) => (
                  <tr key={course.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{course.name}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {course.description || "No description"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {course.level || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {course.duration || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {course.campus || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {course.intakeMonths || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {course.tuitionFee !== null
                        ? `$${course.tuitionFee.toLocaleString()}`
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          course.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/providers/${provider.id}/courses/${course.id}`}
                          className="text-sm font-medium text-black underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/providers/${provider.id}/courses/${course.id}/edit`}
                          className="text-sm font-medium text-blue-600 underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}