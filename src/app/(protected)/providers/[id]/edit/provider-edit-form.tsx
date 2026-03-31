"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProviderFormData = {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  isActive: boolean;
};

type Props = {
  provider: ProviderFormData;
};

export default function EditProviderForm({ provider }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: provider.name,
    code: provider.code,
    country: provider.country,
    city: provider.city,
    email: provider.email,
    phone: provider.phone,
    website: provider.website,
    description: provider.description,
    isActive: provider.isActive,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update provider");
      }

      router.push(`/providers/${provider.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">
            Provider Name
          </label>
          <input
            name="name"
            required
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Deakin University"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Code</label>
          <input
            name="code"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="DEAKIN"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, country: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Australia"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input
              name="city"
              value={form.city}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, city: e.target.value }))
              }
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
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2"
              placeholder="admissions@example.edu"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2"
              placeholder="+61 3 0000 0000"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input
            name="website"
            value={form.website}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, website: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://www.example.edu"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Optional provider notes"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
          />
          Active
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Provider"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/providers/${provider.id}`)}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}