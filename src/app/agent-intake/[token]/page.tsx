import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeFormSchema } from "./normalize-form-schema";
import PublicDynamicIntakeForm from "./public-dynamic-intake-form";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function AgentIntakePage({ params }: PageProps) {
  const { token } = await params;

  const form = await prisma.intakeFormRequest.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      status: true,
      isActive: true,
      submitButtonText: true,
      successMessage: true,
      formSchema: true,
      settings: true,
      expiresAt: true,
    },
  });

  if (!form) {
    notFound();
  }

  const now = new Date();
  const isExpired =
    form.expiresAt !== null && new Date(form.expiresAt).getTime() < now.getTime();

  const isUnavailable = !form.isActive || form.status !== "active" || isExpired;

  if (isUnavailable) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Form Unavailable</h1>
          <p className="mt-3 text-sm text-gray-600">
            This intake form is currently inactive, unavailable, or expired.
          </p>
        </div>
      </div>
    );
  }

  const schema = normalizeFormSchema(form.formSchema);

  return <PublicDynamicIntakeForm form={form} schema={schema} />;
}