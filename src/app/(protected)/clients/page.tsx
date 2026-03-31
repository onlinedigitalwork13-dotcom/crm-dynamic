import Link from "next/link";
import { getClients } from "@/lib/client-service";
import { requireAuth } from "@/lib/require-auth";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
      <span className="mr-1 text-slate-400">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </span>
  );
}

export default async function ClientsPage() {
  await requireAuth();

  const clients = await getClients();

  return (
    <div className="space-y-6">
      {/* Premium hero */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Client Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Clients
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              View, manage, and track client ownership, workflow progress, and
              intake outcomes from a premium operational workspace.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Total visible clients: {clients.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Add Client
            </Link>

            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Clients listing */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Client Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse client records with ownership, source, workflow, and
                stage visibility.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {clients.length === 0
                ? "No clients available"
                : `${clients.length} client${clients.length === 1 ? "" : "s"} found`}
            </div>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10">
              <h3 className="text-base font-semibold text-slate-900">
                No clients found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Once clients are created or assigned, they will appear here.
              </p>

              <div className="mt-5">
                <Link
                  href="/clients/new"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create First Client
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block p-5 transition hover:bg-slate-50 sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  {/* Left block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {client.firstName} {client.lastName}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {client.currentStage?.stageName || "Not started"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                      <p>Email: {client.email || "No email"}</p>
                      <p>Phone: {client.phone}</p>
                      <p>Passport: {client.passport || "Not provided"}</p>
                      <p>Source: {client.source?.name || "No source"}</p>
                      <p>Workflow: {client.workflow?.name || "Not assigned"}</p>
                      <p>
                        Created: {formatDate(client.createdAt)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <InfoPill
                        label="Assigned"
                        value={
                          client.assignedTo
                            ? formatPersonName(
                                client.assignedTo.firstName,
                                client.assignedTo.lastName
                              )
                            : "Unassigned"
                        }
                      />
                      <InfoPill
                        label="Created by"
                        value={
                          client.createdBy
                            ? formatPersonName(
                                client.createdBy.firstName,
                                client.createdBy.lastName
                              )
                            : "System / Unknown"
                        }
                      />
                    </div>
                  </div>

                  {/* Right block */}
                  <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[220px]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Quick Summary
                      </p>
                      <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                        <p>Stage: {client.currentStage?.stageName || "Not started"}</p>
                        <p>Workflow: {client.workflow?.name || "—"}</p>
                        <p>Source: {client.source?.name || "—"}</p>
                      </div>
                    </div>

                    <div className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      Open Client →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}