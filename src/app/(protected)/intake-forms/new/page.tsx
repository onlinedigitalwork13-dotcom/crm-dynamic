import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/require-role";

function generateToken(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now()}`
  );
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

  const publicUrl = `/forms/${token}`;
  const qrCodeValue = publicUrl;

  const form = await prisma.intakeFormRequest.create({
    data: {
      title,
      token,
      status: "draft",
      isActive: false,
      submitButtonText: "Submit",
      successMessage: "Form submitted successfully.",
      formSchema: [
        {
          key: "personal_details",
          title: "Personal Details",
          description: "Basic client information",
          fields: [
            {
              key: "firstName",
              label: "First Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter first name",
            },
            {
              key: "lastName",
              label: "Last Name",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter last name",
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              width: "half",
              placeholder: "Enter email address",
            },
            {
              key: "phone",
              label: "Phone Number",
              type: "text",
              required: true,
              width: "half",
              placeholder: "Enter phone number",
            },
          ],
        },
      ],
      publicUrl,
      qrCodeValue,
      branchId,
      createdById: session.user.id,
    },
    select: {
      id: true,
    },
  });

  redirect(`/intake-forms/${form.id}`);
}