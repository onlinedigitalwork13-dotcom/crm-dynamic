import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProviderDetailPage({ params }: PageProps) {
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
              <h1 className="text-2xl font-bold">{provider.name}</h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  provider.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {provider.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Provider details, linked courses, and education setup overview
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/providers"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to Providers
            </Link>

            <Link
              href={`/providers/${provider.id}/edit`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Edit Provider
            </Link>

            <Link
              href={`/providers/${provider.id}/courses`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              View Courses
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Code
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.code || "-"}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Country
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.country || "-"}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              City
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.city || "-"}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Email
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.email || "-"}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Phone
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.phone || "-"}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Website
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider.website ? (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit Website
                </a>
              ) : (
                "-"
              )}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Courses
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider._count.courses}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Applications
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {provider._count.applications}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {new Date(provider.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4 xl:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Updated
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {new Date(provider.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          <p className="mt-2 text-sm text-gray-600">
            {provider.description || "No description added."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Courses Overview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Quick preview of courses linked to this provider
            </p>
          </div>

          <Link
            href={`/providers/${provider.id}/courses/new`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add Course
          </Link>
        </div>

        {provider.courses.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-gray-500">
              No courses added for this provider yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {provider.courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {course.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        course.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid gap-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-900">Level:</span>{" "}
                      {course.level || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Duration:</span>{" "}
                      {course.duration || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Campus:</span>{" "}
                      {course.campus || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Intakes:</span>{" "}
                      {course.intakeMonths || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Tuition Fee:
                      </span>{" "}
                      {course.tuitionFee !== null
                        ? `$${course.tuitionFee.toLocaleString()}`
                        : "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Description:
                      </span>{" "}
                      {course.description || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/providers/${provider.id}/courses/${course.id}/edit`}
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}

            {provider.courses.length > 5 && (
              <div className="pt-2">
                <Link
                  href={`/providers/${provider.id}/courses`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View all {provider.courses.length} courses
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}