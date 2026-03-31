import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ApplicationEditForm from "./application-edit-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApplicationPage({ params }: PageProps) {
  const { id } = await params;

  const [application, clients, providers, courses] = await Promise.all([
    prisma.clientApplication.findUnique({
      where: { id },
    }),
    prisma.client.findMany({
      orderBy: { firstName: "asc" },
    }),
    prisma.provider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!application) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Application</h1>
        <p className="text-sm text-gray-500">
          Update application details, intake, and status
        </p>
      </div>

      <ApplicationEditForm
        application={{
          id: application.id,
          clientId: application.clientId,
          providerId: application.providerId,
          courseId: application.courseId,
          intake: application.intake,
          intakeYear: application.intakeYear?.toString() || "",
          status: application.status,
          applicationNo: application.applicationNo || "",
          notes: application.notes || "",
          appliedAt: application.appliedAt
            ? new Date(application.appliedAt).toISOString().split("T")[0]
            : "",
        }}
        clients={clients.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        }))}
        providers={providers.map((p) => ({
          id: p.id,
          name: p.name,
        }))}
        courses={courses.map((c) => ({
          id: c.id,
          providerId: c.providerId,
          name: c.name,
        }))}
      />
    </div>
  );
}