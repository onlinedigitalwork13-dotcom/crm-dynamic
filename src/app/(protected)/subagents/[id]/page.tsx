import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type IntakeFormSettings = {
  source?: string;
  channel?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSettingsObject(value: Prisma.JsonValue | null): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;

  return {
    source:
      typeof settings.source === "string" ? settings.source.trim() : undefined,
    channel:
      typeof settings.channel === "string" ? settings.channel.trim() : undefined,
  };
}

function getAbsoluteOrRelativeUrl(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";

  return appUrl
    ? `${appUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`
    : trimmed;
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [agent, intakeForms] = await Promise.all([
    prisma.subagent.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        leads: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    }),

    prisma.intakeFormRequest.findMany({
      select: {
        id: true,
        title: true,
        token: true,
        publicUrl: true,
        isActive: true,
        status: true,
        updatedAt: true,
        settings: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  if (!agent) {
    notFound();
  }

  const sharedAgentIntakeForm =
    intakeForms.find((form) => {
      const settings = getSettingsObject(form.settings as Prisma.JsonValue | null);

      const title = form.title.toLowerCase();
      const source = (settings.source || "").toLowerCase();
      const channel = (settings.channel || "").toLowerCase();

      return (
        form.isActive &&
        form.status === "active" &&
        (channel === "subagent" ||
          source === "subagent" ||
          source === "agent_form" ||
          title.includes("agent"))
      );
    }) ?? null;

  const sharedAgentIntakeUrl = sharedAgentIntakeForm
    ? getAbsoluteOrRelativeUrl(
        sharedAgentIntakeForm.publicUrl || `/forms/${sharedAgentIntakeForm.token}`
      )
    : null;

  const openLeadsCount = agent.leads.filter(
    (lead) => lead.status !== "converted" && lead.status !== "closed"
  ).length;

  const convertedLeadsCount = agent.leads.filter(
    (lead) => lead.status === "converted"
  ).length;

  const conversionRate =
    agent.leads.length > 0
      ? Math.round((convertedLeadsCount / agent.leads.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-lg font-bold text-white">
                {getInitials(agent.name || "A")}
              </div>

              <div>
                <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                  Agent Profile
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {agent.name}
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  {agent.contact || "No contact person"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {agent.referralCode}
                  </span>

                  {agent.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Inactive
                    </span>
                  )}

                  {sharedAgentIntakeForm ? (
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                      Shared Agent Intake Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      Agent Intake Not Configured
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/subagents"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Agents
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {agent.email || "No email"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Phone
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {agent.phone || "No phone"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Country
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {agent.country || "Not set"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Agent Intake Channel
            </p>

            {sharedAgentIntakeForm ? (
              <>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Shared form active
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {sharedAgentIntakeForm.title}
                </p>
                {sharedAgentIntakeUrl ? (
                  <p className="mt-2 break-all text-sm font-medium text-slate-900">
                    {sharedAgentIntakeUrl}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Not configured
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Set up one shared Agent Intake Form in Intake Forms.
                </p>
                <Link
                  href="/intake-forms"
                  className="mt-2 inline-flex text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
                >
                  Set up agent form
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Total Leads
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {agent.leads.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            All leads linked to this agent
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Open Leads
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {openLeadsCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Leads still in progress
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Converted Leads
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {convertedLeadsCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Leads successfully converted
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conversion Rate
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {conversionRate}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Recent Leads</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {agent.leads.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {agent.leads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No leads linked yet.
              </div>
            ) : (
              agent.leads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatPersonName(lead.firstName, lead.lastName)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {lead.email || lead.phone || "No contact info"}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {lead.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Added {formatDate(lead.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Recent Clients</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {agent.clients.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {agent.clients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No clients linked yet.
              </div>
            ) : (
              agent.clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {formatPersonName(client.firstName, client.lastName)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {client.email || client.phone || "No contact info"}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Added {formatDate(client.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}