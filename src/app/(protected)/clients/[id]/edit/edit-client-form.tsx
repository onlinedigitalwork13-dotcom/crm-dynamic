"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { clientMasterSchema } from "@/components/forms/client-master-schema";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";

type LeadSource = {
  id: string;
  name: string;
};

type ClientRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  passport: string | null;
  sourceId: string | null;
  profileData: Prisma.JsonValue;
};

export default function EditClientForm({ client }: { client: ClientRecord }) {
  const router = useRouter();

  const [sources, setSources] = useState<LeadSource[]>([]);
  const [sourceId, setSourceId] = useState(client.sourceId ?? "");
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");

  const { values, setValue, resetValues } = useDynamicForm(clientMasterSchema);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        const data = await res.json();
        setSources(data);
      } catch (error) {
        console.error("Failed to load sources", error);
      } finally {
        setLoadingSources(false);
      }
    }

    fetchSources();
  }, []);

  useEffect(() => {
    const profile =
      client.profileData &&
      typeof client.profileData === "object" &&
      !Array.isArray(client.profileData)
        ? (client.profileData as Record<string, unknown>)
        : {};

    const mergedValues: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(profile).map(([key, value]) => [
          key,
          value == null ? "" : String(value),
        ])
      ),
      firstName: client.firstName ?? "",
      surname: client.lastName ?? "",
      email: client.email ?? "",
      mobile: client.phone ?? "",
      passportNumber: client.passport ?? "",
    };

    for (const [key, value] of Object.entries(mergedValues)) {
      setValue(key, value);
    }
  }, [client, setValue]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      firstName: values.firstName || "",
      lastName: values.surname || "",
      email: values.email || "",
      phone: values.mobile || "",
      passport: values.passportNumber || "",
      sourceId,
      profileData: values,
    };

    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to update client");
      return;
    }

    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DynamicFormRenderer
        schema={clientMasterSchema}
        values={values}
        onChange={setValue}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Lead Source
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            disabled={loadingSources}
          >
            <option value="">Select source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={
              loading ||
              !values.firstName?.trim() ||
              !values.surname?.trim() ||
              !values.mobile?.trim()
            }
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Client"}
          </button>

          <button
            type="button"
            onClick={() => {
              resetValues();
              setSourceId(client.sourceId ?? "");
              setError("");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}