import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditClientForm from "./edit-client-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passport: true,
      sourceId: true,
      profileData: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            Client Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Edit Client
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Update client details using the shared master form while keeping the
            record clean, structured, and consistent across the CRM.
          </p>
        </div>

        <div className="bg-slate-50/70 px-6 py-5 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="First Name" value={client.firstName || "—"} />
            <MetricCard label="Last Name" value={client.lastName || "—"} />
            <MetricCard label="Email" value={client.email || "No email"} />
            <MetricCard label="Phone" value={client.phone || "No phone"} />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <EditClientForm client={client} />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900 break-words">
        {value}
      </p>
    </div>
  );
}