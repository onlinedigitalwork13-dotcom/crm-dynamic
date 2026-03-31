import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export default async function IntakeFormsPage() {
  async function deleteIntakeForm(formData: FormData) {
  "use server";

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    return;
  }

  try {
    const submissionCount = await prisma.intakeFormSubmission.count({
      where: {
        intakeFormRequestId: id,
      },
    });

    if (submissionCount > 0) {
      // 🔒 If used → just deactivate
      await prisma.intakeFormRequest.update({
        where: { id },
        data: {
          isActive: false,
          status: "inactive",
        },
      });
    } else {
      // 🗑 If unused → delete
      await prisma.intakeFormRequest.delete({
        where: { id },
      });
    }

    revalidatePath("/intake-forms");
  } catch (error) {
    console.error("Failed to delete intake form:", error);
  }
}

  const forms = await prisma.intakeFormRequest.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      token: true,
      status: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Intake Forms</p>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Intake Forms
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Customize the shared intake form, manage public links, and share
              via QR.
            </p>
          </div>

          <Link
            href="/intake-forms/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            + Create Form
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="grid grid-cols-12 border-b px-6 py-3 text-sm font-medium text-gray-600">
          <div className="col-span-4">Title</div>
          <div className="col-span-3">Token</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {forms.length === 0 ? (
          <div className="px-6 py-8 text-sm text-gray-600">
            No intake forms found. Create your first form to get started.
          </div>
        ) : (
          forms.map((form) => (
            <div
              key={form.id}
              className="grid grid-cols-12 items-center border-b px-6 py-4 text-sm last:border-b-0"
            >
              <div className="col-span-4 font-medium text-gray-900">
                {form.title}
              </div>

              <div className="col-span-3 text-gray-600">{form.token}</div>

              <div className="col-span-2 text-gray-600">
                {form.isActive ? "Active" : "Inactive"} / {form.status}
              </div>

              <div className="col-span-2 text-gray-600">
                {new Date(form.updatedAt).toLocaleDateString()}
              </div>

              <div className="col-span-1">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/intake-forms/${form.id}`}
                    className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white"
                  >
                    Edit
                  </Link>

                  <form action={deleteIntakeForm}>
                    <input type="hidden" name="id" value={form.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}