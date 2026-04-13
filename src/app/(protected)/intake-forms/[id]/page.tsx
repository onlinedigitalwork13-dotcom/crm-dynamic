import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormBuilderClient from "./form-builder-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IntakeFormEditPage({ params }: PageProps) {
  const { id } = await params;

  const form = await prisma.intakeFormRequest.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      token: true,
      publicUrl: true,
      qrCodeValue: true,
      formSchema: true,
      settings: true,
      submitButtonText: true,
      successMessage: true,
      status: true,
      isActive: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!form) {
    notFound();
  }

  const agents = await prisma.subagent.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      referralCode: true,
      country: true,
      email: true,
      phone: true,
      contact: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Intake Form Builder</p>
        <h1 className="text-2xl font-bold text-gray-900">Edit Intake Form</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
          Customize the shared intake form, manage public sharing, configure
          channel behavior, and preview the same dynamic form experience used
          across your CRM intake flows. This supports general intake, shared
          subagent intake, event intake, and partner intake without changing
          your existing Check-In or Add Client structures.
        </p>
      </div>

      <FormBuilderClient form={form} agents={agents} />
    </div>
  );
}