import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/require-role";
import { Prisma } from "@prisma/client";

function slugifyToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateToken(title: string) {
  const base = slugifyToken(title);
  const suffix = Date.now();
  return `${base || "intake-form"}-${suffix}`;
}

function getDefaultFormSchema(): Prisma.InputJsonValue {
  return [
    {
      key: "personal_details",
      title: "Personal Details",
      description: "Basic student or client information",
      fields: [
        {
          key: "firstName",
          label: "First Name",
          type: "text",
          required: true,
          width: "half",
          placeholder: "Enter first name",
          visible: true,
        },
        {
          key: "lastName",
          label: "Last Name",
          type: "text",
          required: true,
          width: "half",
          placeholder: "Enter last name",
          visible: true,
        },
        {
          key: "email",
          label: "Email",
          type: "email",
          width: "half",
          placeholder: "Enter email address",
          visible: true,
        },
        {
          key: "phone",
          label: "Phone Number",
          type: "tel",
          required: true,
          width: "half",
          placeholder: "Enter phone number",
          visible: true,
        },
        {
          key: "country",
          label: "Country",
          type: "text",
          width: "half",
          placeholder: "Enter country",
          visible: true,
        },
        {
          key: "notes",
          label: "Notes",
          type: "textarea",
          width: "full",
          placeholder: "Add any extra details",
          visible: true,
        },
      ],
    },
  ] as Prisma.InputJsonValue;
}

function getDefaultSettings(): Prisma.InputJsonValue {
  return {
    // backward compatibility
    referralType: "standard",
    agentId: null,
    source: "intake_form",

    // new channel-based system
    channel: "general",
    agentMode: "none",
    defaultAgentId: null,
  };
}

function buildPublicUrl(token: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";
  return base ? `${base}/forms/${token}` : `/forms/${token}`;
}

export default async function NewIntakeFormPage() {
  const session = await requireRole(["admin", "super_admin"]);

  const title = "New Intake Form";
  const token = generateToken(title);

  const branchId = session.user.branchId ?? null;

  if (!branchId) {
    throw new Error(
      "Branch is required to create a new intake form. Please assign a branch to this admin user first."
    );
  }

  const publicUrl = buildPublicUrl(token);
  const qrCodeValue = publicUrl;

  const form = await prisma.intakeFormRequest.create({
    data: {
      title,
      token,
      status: "draft",
      isActive: false,
      submitButtonText: "Submit",
      successMessage: "Form submitted successfully.",
      formSchema: getDefaultFormSchema(),
      settings: getDefaultSettings(),
      publicUrl,
      qrCodeValue,
      branchId,
      createdById: session.user.id,
      sharedAt: null,
      description: null,
      notes: null,
    },
    select: {
      id: true,
    },
  });

  redirect(`/intake-forms/${form.id}`);
}