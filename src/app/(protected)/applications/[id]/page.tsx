import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JourneyForm from "./journey-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
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
      checklistItems: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {application.client.firstName} {application.client.lastName}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Application details, journey tracking, and checklist overview
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/applications"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </Link>
            <Link
              href={`/applications/${application.id}/edit`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard label="Provider" value={application.provider.name} />
          <InfoCard label="Course" value={application.course.name} />
          <InfoCard label="Status" value={application.status} />
          <InfoCard
            label="Intake"
            value={`${application.intake} ${application.intakeYear || ""}`.trim()}
          />
          <InfoCard label="Application No" value={application.applicationNo || "-"} />
          <InfoCard
            label="Applied At"
            value={
              application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString()
                : "-"
            }
          />
        </div>

        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="mt-2 text-sm text-gray-600">
            {application.notes || "No notes added."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Application Journey</h2>
            <p className="mt-1 text-sm text-gray-500">
              Education workflow up to COE, then visa workflow after COE.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Education Workflow
              </h3>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <JourneyItem
                  label="Offer Status"
                  value={application.journey?.offerStatus || "-"}
                />
                <JourneyItem
                  label="Offer Type"
                  value={application.journey?.offerType || "-"}
                />
                <JourneyItem
                  label="Offer Conditions"
                  value={application.journey?.offerConditions || "-"}
                />
                <JourneyItem
                  label="Offer Received At"
                  value={formatDate(application.journey?.offerReceivedAt)}
                />
                <JourneyItem
                  label="Offer Accepted At"
                  value={formatDate(application.journey?.offerAcceptedAt)}
                />
                <JourneyItem
                  label="COE Status"
                  value={application.journey?.coeStatus || "-"}
                />
                <JourneyItem
                  label="COE Number"
                  value={application.journey?.coeNumber || "-"}
                />
                <JourneyItem
                  label="COE Issued At"
                  value={formatDate(application.journey?.coeIssuedAt)}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Visa Workflow
              </h3>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <JourneyItem
                  label="Visa Status"
                  value={application.journey?.visaStatus || "-"}
                />
                <JourneyItem
                  label="Visa File Number"
                  value={application.journey?.visaFileNumber || "-"}
                />
                <JourneyItem
                  label="Visa Lodged At"
                  value={formatDate(application.journey?.visaLodgedAt)}
                />
                <JourneyItem
                  label="Visa Granted At"
                  value={formatDate(application.journey?.visaGrantedAt)}
                />
                <JourneyItem
                  label="Visa Refused At"
                  value={formatDate(application.journey?.visaRefusedAt)}
                />
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Remarks
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {application.journey?.remarks || "-"}
                </p>
              </div>
            </div>

            <JourneyForm
              applicationId={application.id}
              initialData={{
                offerStatus: application.journey?.offerStatus || "",
                offerType: application.journey?.offerType || "",
                offerConditions: application.journey?.offerConditions || "",
                offerReceivedAt: toDateInputValue(application.journey?.offerReceivedAt),
                offerAcceptedAt: toDateInputValue(application.journey?.offerAcceptedAt),
                coeStatus: application.journey?.coeStatus || "",
                coeNumber: application.journey?.coeNumber || "",
                coeIssuedAt: toDateInputValue(application.journey?.coeIssuedAt),
                visaStatus: application.journey?.visaStatus || "",
                visaFileNumber: application.journey?.visaFileNumber || "",
                visaLodgedAt: toDateInputValue(application.journey?.visaLodgedAt),
                visaGrantedAt: toDateInputValue(application.journey?.visaGrantedAt),
                visaRefusedAt: toDateInputValue(application.journey?.visaRefusedAt),
                remarks: application.journey?.remarks || "",
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Checklist Summary</h2>

          {application.checklistItems.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No checklist items yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {application.checklistItems.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.status} {item.category ? `• ${item.category}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function JourneyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function toDateInputValue(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}