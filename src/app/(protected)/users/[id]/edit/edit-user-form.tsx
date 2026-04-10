"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RoleOption = {
  id: string;
  name: string;
};

type BranchOption = {
  id: string;
  name: string;
  code: string;
};

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  branchId: string | null;
};

type TransferableUserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  branchId: string | null;
  role: {
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type Props = {
  user: UserData;
  roles: RoleOption[];
  branches: BranchOption[];
  transferableUsers: TransferableUserOption[];
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  branchId: string;
  isActive: boolean;
};

function formatRoleLabel(value?: string | null) {
  if (!value) return "Unknown";
  return value
    .trim()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EditUserForm({
  user,
  roles,
  branches,
  transferableUsers,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    roleId: user.roleId ?? "",
    branchId: user.branchId ?? "",
    isActive: user.isActive,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetUserId, setTargetUserId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");
  const [transferError, setTransferError] = useState("");

  const filteredTransferableUsers = useMemo(() => {
    if (!form.branchId) {
      return transferableUsers;
    }

    const sameBranchUsers = transferableUsers.filter(
      (candidate) => candidate.branchId === form.branchId
    );

    return sameBranchUsers.length > 0 ? sameBranchUsers : transferableUsers;
  }, [form.branchId, transferableUsers]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.email.trim()) return "Email is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return "Enter a valid email address";
    }

    if (!form.roleId) return "Please select a role";

    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          roleId: form.roleId,
          branchId: form.branchId || null,
          isActive: form.isActive,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: { error?: string; message?: string } | null = null;

      if (contentType.includes("application/json")) {
        data = (await response.json()) as { error?: string; message?: string };
      } else {
        const text = await response.text();
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        setError(data?.error || data?.message || "Failed to update user");
        return;
      }

      router.push("/users");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the user");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTransfer() {
    setTransferMessage("");
    setTransferError("");

    if (!targetUserId) {
      setTransferError("Please select a target user.");
      return;
    }

    if (targetUserId === user.id) {
      setTransferError("Cannot transfer data to the same user.");
      return;
    }

    try {
      setTransferLoading(true);

      const response = await fetch(`/api/users/${user.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toUserId: targetUserId,
          transferAssignedClients: true,
          transferAssignedTasks: true,
          transferAssignedLeads: true,
          transferAssignedIntakeRequests: true,
          transferAssignedIntakeSubmissions: true,
          deactivateSourceUser: true,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data:
        | {
            error?: string;
            message?: string;
          }
        | null = null;

      if (contentType.includes("application/json")) {
        data = (await response.json()) as {
          error?: string;
          message?: string;
        };
      } else {
        const text = await response.text();
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        setTransferError(data?.error || data?.message || "Transfer failed.");
        return;
      }

      setTransferMessage(data?.message || "Data transferred successfully.");

      setTimeout(() => {
        router.push("/users");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(err);
      setTransferError("Something went wrong while transferring user data.");
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              id="phone"
              type="text"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              placeholder="Optional"
            />
          </div>

          <div>
            <label
              htmlFor="roleId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="roleId"
              value={form.roleId}
              onChange={(e) => updateField("roleId", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="branchId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Branch
            </label>
            <select
              id="branchId"
              value={form.branchId}
              onChange={(e) => updateField("branchId", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="">No branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
              />
              User is active
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/users")}
            className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Transfer User Data
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Transfer all assigned work to another staff member and deactivate
            this user after successful handover.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="targetUserId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select target user
            </label>
            <select
              id="targetUserId"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">Select target user</option>
              {filteredTransferableUsers.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.firstName} {candidate.lastName} — {candidate.email}
                  {candidate.branch
                    ? ` (${candidate.branch.name}${
                        candidate.branch.code ? ` - ${candidate.branch.code}` : ""
                      })`
                    : ""}
                  {candidate.role?.name
                    ? ` · ${formatRoleLabel(candidate.role.name)}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 md:grid-cols-2">
            <div>• Assigned clients will move to the selected user</div>
            <div>• Assigned tasks will move to the selected user</div>
            <div>• Assigned leads will move to the selected user</div>
            <div>• Intake requests/submissions will move as well</div>
          </div>

          {transferError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {transferError}
            </div>
          ) : null}

          {transferMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {transferMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleTransfer}
            disabled={transferLoading}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {transferLoading
              ? "Transferring..."
              : "Transfer Data & Deactivate User"}
          </button>
        </div>
      </div>
    </div>
  );
}