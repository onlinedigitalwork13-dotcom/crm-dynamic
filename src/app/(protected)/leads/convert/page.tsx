import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function LeadConvertPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      intakeSubmission: true,
      client: true,
      agent: true,
    },
  });

  if (!lead) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Convert Lead</h1>

      <div className="mt-4 border p-4 rounded">
        <p><b>Name:</b> {lead.firstName} {lead.lastName}</p>
        <p><b>Email:</b> {lead.email}</p>
        <p><b>Phone:</b> {lead.phone}</p>
      </div>

      <div className="mt-6">
        <button className="bg-black text-white px-4 py-2 rounded">
          Convert to Client
        </button>
      </div>
    </div>
  );
}