import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JourneyForm from "./journey-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const application = await prisma.clientApplication.findUnique({
    where: { id },
    include: {
      client: true,
      provider: true,
      course: true,
      journey: true,
      checklistItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!application) notFound();

  return (
    <div className="space-y-6">

      {/* 🔥 HEADER */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">

          <div>
            <p className="text-sm text-gray-500">Application</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {application.client.firstName} {application.client.lastName}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {application.provider.name} • {application.course.name}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/applications" className="btn-secondary">
              Back
            </Link>
            <Link
              href={`/applications/${application.id}/edit`}
              className="btn-primary"
            >
              Edit
            </Link>
          </div>

        </div>

        {/* 🔥 STATUS BAR */}
        <div className="mt-6 flex flex-wrap gap-3">
          <StatusBadge status={application.status} />
          <MiniBadge label={`Intake: ${application.intake}`} />
          <MiniBadge label={`Year: ${application.intakeYear || "-"}`} />
          <MiniBadge label={`App No: ${application.applicationNo || "-"}`} />
        </div>
      </div>

      {/* 🔥 MAIN GRID */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* LEFT SIDE */}
        <div className="xl:col-span-2 space-y-6">

          {/* 🔥 JOURNEY */}
          <Card title="Application Journey">
            <JourneySection application={application} />

            <div className="mt-6">
              <JourneyForm
                applicationId={application.id}
                initialData={{
                  offerStatus: application.journey?.offerStatus || "",
                  offerType: application.journey?.offerType || "",
                  offerConditions: application.journey?.offerConditions || "",
                  offerReceivedAt: toDate(application.journey?.offerReceivedAt),
                  offerAcceptedAt: toDate(application.journey?.offerAcceptedAt),
                  coeStatus: application.journey?.coeStatus || "",
                  coeNumber: application.journey?.coeNumber || "",
                  coeIssuedAt: toDate(application.journey?.coeIssuedAt),
                  visaStatus: application.journey?.visaStatus || "",
                  visaFileNumber: application.journey?.visaFileNumber || "",
                  visaLodgedAt: toDate(application.journey?.visaLodgedAt),
                  visaGrantedAt: toDate(application.journey?.visaGrantedAt),
                  visaRefusedAt: toDate(application.journey?.visaRefusedAt),
                  remarks: application.journey?.remarks || "",
                }}
              />
            </div>
          </Card>

          {/* 🔥 NOTES */}
          <Card title="Internal Notes">
            <p className="text-sm text-gray-600">
              {application.notes || "No notes added."}
            </p>
          </Card>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* 🔥 CLIENT PANEL */}
          <Card title="Client">
            <p className="font-semibold text-gray-900">
              {application.client.firstName} {application.client.lastName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {application.client.email || "No email"}
            </p>
          </Card>

          {/* 🔥 CHECKLIST */}
          <Card title="Checklist Progress">
            {application.checklistItems.length === 0 ? (
              <p className="text-sm text-gray-500">No checklist items</p>
            ) : (
              <div className="space-y-3">
                {application.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {item.category || "-"}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>
    </div>
  );
}

/* 🔥 COMPONENTS */

function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: any) {
  const value = (status || "").toLowerCase();

  let style = "bg-gray-100 text-gray-700";

  if (value.includes("approved") || value.includes("granted"))
    style = "bg-green-100 text-green-700";
  else if (value.includes("pending"))
    style = "bg-yellow-100 text-yellow-700";
  else if (value.includes("rejected"))
    style = "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style}`}>
      {status || "-"}
    </span>
  );
}

function MiniBadge({ label }: any) {
  return (
    <span className="bg-gray-100 px-3 py-1 text-xs rounded-full text-gray-700">
      {label}
    </span>
  );
}

function JourneySection({ application }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2">

      <JourneyItem label="Offer" value={application.journey?.offerStatus} />
      <JourneyItem label="COE" value={application.journey?.coeStatus} />
      <JourneyItem label="Visa" value={application.journey?.visaStatus} />
      <JourneyItem label="Offer Type" value={application.journey?.offerType} />

    </div>
  );
}

function JourneyItem({ label, value }: any) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value || "-"}</p>
    </div>
  );
}

function toDate(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}