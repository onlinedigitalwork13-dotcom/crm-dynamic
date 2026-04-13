import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type IntakeFormSettings = {
  channel?: "general" | "subagent" | "event" | "partner";
  referralType?: "standard" | "agent";
  source?: string;
};

function getSettingsObject(value: Prisma.JsonValue | null): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;

  return {
    channel:
      settings.channel === "subagent" ||
      settings.channel === "event" ||
      settings.channel === "partner"
        ? settings.channel
        : "general",
    referralType:
      settings.referralType === "agent" ? "agent" : "standard",
    source:
      typeof settings.source === "string" ? settings.source : undefined,
  };
}

function getChannelLabel(settings: IntakeFormSettings) {
  if (settings.channel === "subagent") return "Subagent";
  if (settings.channel === "event") return "Event";
  if (settings.channel === "partner") return "Partner";
  if (settings.referralType === "agent") return "Subagent";
  return "General";
}

function getResolvedStatus(form: { isActive: boolean; status: string }) {
  if (form.status === "active" && form.isActive) return "active";
  if (form.status === "archived") return "archived";
  if (form.status === "inactive") return "inactive";
  return "draft";
}

function getStatusLabel(form: { isActive: boolean; status: string }) {
  const resolved = getResolvedStatus(form);

  if (resolved === "active") return "Active";
  if (resolved === "inactive") return "Inactive";
  if (resolved === "archived") return "Archived";
  return "Draft";
}

function getStatusBadgeClass(form: { isActive: boolean; status: string }) {
  const resolved = getResolvedStatus(form);

  if (resolved === "active") {
    return "bg-green-100 text-green-700";
  }

  if (resolved === "draft") {
    return "bg-amber-100 text-amber-700";
  }

  if (resolved === "archived") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-gray-100 text-gray-700";
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString();
}

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
        await prisma.intakeFormRequest.update({
          where: { id },
          data: {
            isActive: false,
            status: "inactive",
          },
        });
      } else {
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
      publicUrl: true,
      settings: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  const totalForms = forms.length;
  const activeForms = forms.filter(
    (form) => getResolvedStatus(form) === "active"
  ).length;
  const subagentForms = forms.filter((form) => {
    const settings = getSettingsObject(form.settings as Prisma.JsonValue | null);
    return getChannelLabel(settings) === "Subagent";
  }).length;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-gradient-to-r from-gray-950 via-gray-900 to-black px-6 py-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-gray-300">Intake Forms</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Manage Intake Forms
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                Create and manage public intake channels for general inquiries,
                shared subagent submissions, events, and partner referrals
                without affecting your existing Check-In or Add Client
                structures.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-300">Total Forms</p>
                <p className="mt-1 text-xl font-semibold">{totalForms}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-300">Active</p>
                <p className="mt-1 text-xl font-semibold">{activeForms}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-300">Subagent</p>
                <p className="mt-1 text-xl font-semibold">{subagentForms}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm text-gray-600">
            Manage public links, QR-enabled forms, and intake channels in one
            place.
          </div>

          <Link
            href="/intake-forms/new"
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm"
          >
            + Create Form
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="hidden grid-cols-12 border-b px-6 py-3 text-sm font-medium text-gray-600 md:grid">
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Channel</div>
          <div className="col-span-2">Token</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Submissions</div>
          <div className="col-span-1">Updated</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {forms.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            No intake forms found. Create your first form to get started.
          </div>
        ) : (
          <>
            <div className="divide-y md:hidden">
              {forms.map((form) => {
                const settings = getSettingsObject(
                  form.settings as Prisma.JsonValue | null
                );
                const channelLabel = getChannelLabel(settings);

                return (
                  <div key={form.id} className="space-y-4 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-gray-900">
                          {form.title}
                        </h2>
                        <p className="mt-1 break-all text-xs text-gray-500">
                          {form.publicUrl || `/forms/${form.token}`}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                          form
                        )}`}
                      >
                        {getStatusLabel(form)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Channel
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {channelLabel}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Submissions
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {form._count.submissions}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Updated
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(form.updatedAt)}
                        </p>
                      </div>
                    </div>

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
                );
              })}
            </div>

            <div className="hidden divide-y md:block">
              {forms.map((form) => {
                const settings = getSettingsObject(
                  form.settings as Prisma.JsonValue | null
                );
                const channelLabel = getChannelLabel(settings);

                return (
                  <div
                    key={form.id}
                    className="grid grid-cols-12 items-center px-6 py-5 text-sm"
                  >
                    <div className="col-span-3 min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {form.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {form.publicUrl || `/forms/${form.token}`}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {channelLabel}
                      </span>
                    </div>

                    <div className="col-span-2 truncate text-gray-600">
                      {form.token}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                          form
                        )}`}
                      >
                        {getStatusLabel(form)}
                      </span>
                    </div>

                    <div className="col-span-1 font-medium text-gray-900">
                      {form._count.submissions}
                    </div>

                    <div className="col-span-1 text-gray-600">
                      {formatDate(form.updatedAt)}
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
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}