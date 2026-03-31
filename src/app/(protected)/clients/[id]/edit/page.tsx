import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditClientForm from "./edit-client-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passport: true,
      sourceId: true,
      profileData: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Client</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update client using the shared master form.
        </p>
      </div>

      <EditClientForm client={client} />
    </div>
  );
}