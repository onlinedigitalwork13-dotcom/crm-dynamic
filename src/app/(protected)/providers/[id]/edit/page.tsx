import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProviderPage({ params }: PageProps) {
  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
  });

  if (!provider) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Provider</h1>
        <p className="text-sm text-gray-500">
          Update university, college, or education partner details
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <form action={`/api/providers/${provider.id}`} method="post" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Provider Name
            </label>
            <input
              name="name"
              required
              defaultValue={provider.name}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Deakin University"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <input
              name="code"
              defaultValue={provider.code || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="DEAKIN"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Country</label>
              <input
                name="country"
                defaultValue={provider.country || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Australia"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <input
                name="city"
                defaultValue={provider.city || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Melbourne"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={provider.email || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="admissions@example.edu"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                defaultValue={provider.phone || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="+61 3 0000 0000"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Website</label>
            <input
              name="website"
              defaultValue={provider.website || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://www.example.edu"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={provider.description || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Optional provider notes"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Update Provider
          </button>
        </form>
      </div>
    </div>
  );
}