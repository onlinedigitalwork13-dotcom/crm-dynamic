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
      checklistItems: {
        orderBy: { createdAt: "desc" },
        include: {
          documents: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!application) notFound();

  const checklistTotal = application.checklistItems.length;
  const checklistCompleted = application.checklistItems.filter((item) =>
    ["received", "verified"].includes((item.status || "").toLowerCase())
  ).length;
  const checklistPending = checklistItemsPending(application.checklistItems);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-950 via-slate-900 to-black px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Application Workspace
              </p>
              <h1 className="mt-2 truncate text-3xl font-bold tracking-tight sm:text-4xl">
                {application.client.firstName} {application.client.lastName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Premium application view for provider selection, journey tracking,
                checklist handling, and internal operational follow-up.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill status={application.status} />
                <NeutralPill label={`Provider: ${application.provider.name}`} />
                <NeutralPill label={`Course: ${application.course.name}`} />
                <NeutralPill
                  label={`Intake: ${`${application.intake} ${
                    application.intakeYear || ""
                  }`.trim()}`}
                />
                <NeutralPill
                  label={`Application No: ${application.applicationNo || "-"}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/applications"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back
              </Link>
              <Link
                href={`/applications/${application.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Edit Application
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
          <MetricCard
            label="Application Status"
            value={application.status || "-"}
            tone={statusTone(application.status)}
          />
          <MetricCard
            label="Checklist Completed"
            value={`${checklistCompleted}/${checklistTotal}`}
            tone="green"
          />
          <MetricCard
            label="Checklist Pending"
            value={String(checklistPending)}
            tone={checklistPending > 0 ? "amber" : "green"}
          />
          <MetricCard
            label="Applied Date"
            value={
              application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString()
                : "-"
            }
            tone="slate"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <Panel
            title="Application Overview"
            description="Core application details connected to provider, course, client, and intake."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Provider" value={application.provider.name} />
              <InfoCard label="Course" value={application.course.name} />
              <InfoCard
                label="Status"
                value={application.status || "-"}
              />
              <InfoCard
                label="Intake"
                value={`${application.intake} ${application.intakeYear || ""}`.trim()}
              />
              <InfoCard
                label="Application No"
                value={application.applicationNo || "-"}
              />
              <InfoCard
                label="Applied At"
                value={
                  application.appliedAt
                    ? new Date(application.appliedAt).toLocaleDateString()
                    : "-"
                }
              />
            </div>
          </Panel>

          <Panel
            title="Application Journey"
            description="Track education workflow through offer and COE, then continue through the visa workflow."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <JourneyGroup
                title="Education Workflow"
                items={[
                  {
                    label: "Offer Status",
                    value: application.journey?.offerStatus || "-",
                  },
                  {
                    label: "Offer Type",
                    value: application.journey?.offerType || "-",
                  },
                  {
                    label: "Offer Conditions",
                    value: application.journey?.offerConditions || "-",
                  },
                  {
                    label: "Offer Received At",
                    value: formatDate(application.journey?.offerReceivedAt),
                  },
                  {
                    label: "Offer Accepted At",
                    value: formatDate(application.journey?.offerAcceptedAt),
                  },
                  {
                    label: "COE Status",
                    value: application.journey?.coeStatus || "-",
                  },
                  {
                    label: "COE Number",
                    value: application.journey?.coeNumber || "-",
                  },
                  {
                    label: "COE Issued At",
                    value: formatDate(application.journey?.coeIssuedAt),
                  },
                ]}
              />

              <JourneyGroup
                title="Visa Workflow"
                items={[
                  {
                    label: "Visa Status",
                    value: application.journey?.visaStatus || "-",
                  },
                  {
                    label: "Visa File Number",
                    value: application.journey?.visaFileNumber || "-",
                  },
                  {
                    label: "Visa Lodged At",
                    value: formatDate(application.journey?.visaLodgedAt),
                  },
                  {
                    label: "Visa Granted At",
                    value: formatDate(application.journey?.visaGrantedAt),
                  },
                  {
                    label: "Visa Refused At",
                    value: formatDate(application.journey?.visaRefusedAt),
                  },
                  {
                    label: "Remarks",
                    value: application.journey?.remarks || "-",
                  },
                ]}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
              <JourneyForm
                applicationId={application.id}
                initialData={{
                  offerStatus: application.journey?.offerStatus || "",
                  offerType: application.journey?.offerType || "",
                  offerConditions: application.journey?.offerConditions || "",
                  offerReceivedAt: toDateInputValue(
                    application.journey?.offerReceivedAt
                  ),
                  offerAcceptedAt: toDateInputValue(
                    application.journey?.offerAcceptedAt
                  ),
                  coeStatus: application.journey?.coeStatus || "",
                  coeNumber: application.journey?.coeNumber || "",
                  coeIssuedAt: toDateInputValue(application.journey?.coeIssuedAt),
                  visaStatus: application.journey?.visaStatus || "",
                  visaFileNumber: application.journey?.visaFileNumber || "",
                  visaLodgedAt: toDateInputValue(
                    application.journey?.visaLodgedAt
                  ),
                  visaGrantedAt: toDateInputValue(
                    application.journey?.visaGrantedAt
                  ),
                  visaRefusedAt: toDateInputValue(
                    application.journey?.visaRefusedAt
                  ),
                  remarks: application.journey?.remarks || "",
                }}
              />
            </div>
          </Panel>

          <Panel
            title="Internal Notes"
            description="Private notes and operational context for the application."
          >
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm leading-7 text-gray-700">
                {application.notes || "No notes added."}
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Client Snapshot"
            description="Linked client information for fast reference."
          >
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-lg font-semibold text-gray-900">
                {application.client.firstName} {application.client.lastName}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {application.client.email || "No email"}
              </p>
              <div className="mt-4">
                <Link
                  href={`/clients/${application.client.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open Client
                </Link>
              </div>
            </div>
          </Panel>

          <Panel
            title="Checklist Progress"
            description="Track required items, supporting files, and completion progress."
          >
            {application.checklistItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  No checklist items yet
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Add checklist templates or generate checklist items for this
                  application workflow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {application.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.category || "No category"}
                        </p>
                      </div>

                      <StatusPill status={item.status} compact />
                    </div>

                    {item.description ? (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {item.description}
                      </p>
                    ) : null}

                    {item.documents?.length ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Attached documents
                        </p>

                        {item.documents.map((document) => (
                          <a
                            key={document.id}
                            href={document.filePath}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm transition hover:bg-gray-100"
                          >
                            <span className="truncate pr-4 text-gray-800">
                              {document.title}
                            </span>
                            <span className="shrink-0 font-medium text-gray-600">
                              View
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                        No documents attached yet.
                      </div>
                    )}

                    <div className="mt-4">
                      <Link
                        href={`/applications/${application.id}/checklist`}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Manage Checklist
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "slate";
}) {
  const toneMap = {
    green:
      "border-green-200 bg-green-50 text-green-800",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800",
    red:
      "border-red-200 bg-red-50 text-red-800",
    slate:
      "border-slate-200 bg-slate-50 text-slate-800",
  } as const;

  return (
    <div
      className={`rounded-2xl border p-4 ${toneMap[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function JourneyGroup({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        {title}
      </h3>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        {items.map((item) => (
          <JourneyItem
            key={`${title}-${item.label}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
}

function JourneyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function StatusPill({
  status,
  compact = false,
}: {
  status: string | null | undefined;
  compact?: boolean;
}) {
  const value = (status || "").toLowerCase();

  let classes = "bg-gray-100 text-gray-700 border-gray-200";

  if (
    value.includes("approved") ||
    value.includes("granted") ||
    value.includes("verified") ||
    value.includes("received") ||
    value.includes("completed")
  ) {
    classes = "bg-green-100 text-green-700 border-green-200";
  } else if (
    value.includes("pending") ||
    value.includes("requested") ||
    value.includes("draft") ||
    value.includes("processing") ||
    value.includes("lodged") ||
    value.includes("applied")
  ) {
    classes = "bg-yellow-100 text-yellow-700 border-yellow-200";
  } else if (
    value.includes("rejected") ||
    value.includes("refused") ||
    value.includes("closed") ||
    value.includes("cancelled")
  ) {
    classes = "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-semibold ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
      } ${classes}`}
    >
      {status || "-"}
    </span>
  );
}

function NeutralPill({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
      {label}
    </span>
  );
}

function checklistItemsPending(
  items: {
    status: string;
  }[]
) {
  return items.filter((item) =>
    ["pending", "requested", "draft"].includes((item.status || "").toLowerCase())
  ).length;
}

function statusTone(
  status: string | null | undefined
): "green" | "amber" | "red" | "slate" {
  const value = (status || "").toLowerCase();

  if (
    value.includes("approved") ||
    value.includes("granted") ||
    value.includes("completed")
  ) {
    return "green";
  }

  if (
    value.includes("pending") ||
    value.includes("applied") ||
    value.includes("submitted") ||
    value.includes("processing")
  ) {
    return "amber";
  }

  if (
    value.includes("rejected") ||
    value.includes("refused") ||
    value.includes("cancelled")
  ) {
    return "red";
  }

  return "slate";
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function toDateInputValue(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}