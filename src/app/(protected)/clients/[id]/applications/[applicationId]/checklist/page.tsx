import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChecklistForm from "./checklist-form";

type PageProps = {
  params: Promise<{
    id: string;
    applicationId: string;
  }>;
};

export default async function ApplicationChecklistPage({ params }: PageProps) {
  const { id, applicationId } = await params;

  const application = await prisma.clientApplication.findFirst({
    where: {
      id: applicationId,
      clientId: id,
    },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2">
            <Link
              href={`/clients/${id}/applications`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Applications
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Application Checklist
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Manage required documents for this client application.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Application</div>
          <div className="mt-1 font-semibold text-gray-900">
            {application.provider.name} — {application.course.name}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Intake: {application.intake}
            {application.intakeYear ? ` ${application.intakeYear}` : ""}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Status: {application.status}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Client: {application.client.firstName} {application.client.lastName}
          </div>
        </div>
      </div>

      <ChecklistForm
        clientId={id}
        applicationId={applicationId}
        applicationLabel={`${application.provider.name} — ${application.course.name}`}
      />
    </div>
  );
}