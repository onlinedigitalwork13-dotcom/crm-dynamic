"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { clientMasterSchema } from "@/components/forms/client-master-schema";
import {
  useDynamicForm,
  type DynamicFormValues,
} from "@/components/forms/use-dynamic-form";

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

function toSafeString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function buildClientFormValues(client: ClientRecord): DynamicFormValues {
  const profile =
    client.profileData &&
    typeof client.profileData === "object" &&
    !Array.isArray(client.profileData)
      ? (client.profileData as Record<string, unknown>)
      : {};

  return {
    ...Object.fromEntries(
      Object.entries(profile).map(([key, value]) => [key, value ?? ""])
    ),
    firstName: client.firstName ?? "",
    surname: client.lastName ?? "",
    email: client.email ?? "",
    mobile: client.phone ?? "",
    passportNumber: client.passport ?? "",
  };
}

export default function EditClientForm({ client }: { client: ClientRecord }) {
  const router = useRouter();

  const [sources, setSources] = useState<LeadSource[]>([]);
  const [sourceId, setSourceId] = useState(client.sourceId ?? "");
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");

  const initialFormValues = useMemo(() => buildClientFormValues(client), [client]);

  const { values, setValue, setAllValues } = useDynamicForm(
    clientMasterSchema,
    initialFormValues
  );

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        const data = await res.json();
        setSources(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error("Failed to load sources", fetchError);
      } finally {
        setLoadingSources(false);
      }
    }

    fetchSources();
  }, []);

  useEffect(() => {
    setAllValues(initialFormValues);
    setSourceId(client.sourceId ?? "");
    setError("");
  }, [client, initialFormValues, setAllValues]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const firstName = toSafeString(values.firstName).trim();
    const lastName = toSafeString(values.surname).trim();
    const email = toSafeString(values.email).trim();
    const phone = toSafeString(values.mobile).trim();
    const passport = toSafeString(values.passportNumber).trim();

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      passport,
      sourceId,
      profileData: values,
    };

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to update client");
        return;
      }

      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (submitError) {
      console.error("Failed to update client", submitError);
      setError("Failed to update client");
    } finally {
      setLoading(false);
    }
  }

  const firstName = toSafeString(values.firstName).trim();
  const surname = toSafeString(values.surname).trim();
  const mobile = toSafeString(values.mobile).trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DynamicFormRenderer
        schema={clientMasterSchema}
        values={values}
        onChange={setValue}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Lead Source</label>
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
            disabled={loading || !firstName || !surname || !mobile}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Client"}
          </button>

          <button
            type="button"
            onClick={() => {
              setAllValues(initialFormValues);
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