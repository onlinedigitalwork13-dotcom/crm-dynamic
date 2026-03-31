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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Intake Form Builder</p>
        <h1 className="text-2xl font-bold text-gray-900">Edit Intake Form</h1>
        <p className="mt-2 text-sm text-gray-600">
          Customize the shared intake form, manage public sharing, and preview
          the same form used in Add Client, Check-In, and public intake.
        </p>
      </div>

      <FormBuilderClient form={form} />
    </div>
  );
}