import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentPublicForm from "./public-form";

type PageProps = {
  params: Promise<{
    referralCode: string;
  }>;
};

export default async function AgentReferralPage({ params }: PageProps) {
  const { referralCode } = await params;

  const agent = await prisma.subagent.findUnique({
    where: { referralCode },
    select: {
      id: true,
      name: true,
      contact: true,
      country: true,
      referralCode: true,
      isActive: true,
    },
  });

  if (!agent || !agent.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
            Agent Referral Intake
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Start Your Application
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Complete the form below to submit your enquiry. Your application is
            being referred through{" "}
            <span className="font-semibold text-slate-900">{agent.name}</span>,
            and our team will review it as a new lead in CRM.
          </p>
        </div>

        <AgentPublicForm
          agent={{
            id: agent.id,
            name: agent.name,
            contact: agent.contact,
            country: agent.country,
            referralCode: agent.referralCode,
          }}
        />
      </div>
    </div>
  );
}