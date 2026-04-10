import { notFound } from "next/navigation";
import { getBranchById } from "@/lib/branch-service";
import BranchForm from "@/components/branches/branch-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBranchPage({ params }: Props) {
  try {
    const { id } = await params;

    const branch = await getBranchById(id);

    return (
      <div className="space-y-8">
        {/* Premium Header */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Office Administration
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Edit Branch
            </h1>

            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Update branch details, manage office structure, and control
              operational status with a premium editing experience.
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <BranchForm
            mode="edit"
            branch={{
              id: branch.id,
              name: branch.name,
              code: branch.code,
              address: branch.address,
              city: branch.city,
              country: branch.country,
              phone: branch.phone,
              email: branch.email,
              isActive: branch.isActive,
            }}
          />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Edit branch page error:", error);
    notFound();
  }
}