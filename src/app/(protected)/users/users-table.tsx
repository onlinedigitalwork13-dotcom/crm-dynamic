"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResetPasswordDialog from "./reset-password-dialog";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date | string;
  roleId: string;
  branchId: string | null;
  role: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type Props = {
  users: User[];
};

function formatRole(role?: string | null) {
  if (!role) return "Unknown";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export default function UsersTable({ users }: Props) {
  const router = useRouter();
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const role = (user.role?.name || "").toLowerCase();
      const branch = `${user.branch?.name || ""} ${user.branch?.code || ""}`.toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        branch.includes(query)
      );
    });
  }, [users, search]);

  async function toggleActive(user: User) {
    try {
      setLoadingId(user.id);

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
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
        alert(data?.error || data?.message || "Failed to update user");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200/80 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Team Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View, update, activate, and secure user accounts across your CRM
                workspace.
              </p>
            </div>

            <div className="w-full max-w-md">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, role, or branch..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredUsers.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                0
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900">
                No users found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search or create a new user.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="space-y-4 px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white shadow-sm">
                      {getInitials(user.firstName, user.lastName)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="mt-1 break-all text-sm text-slate-600">
                        {user.email}
                      </div>
                      {user.phone ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {user.phone}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Role
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {formatRole(user.role?.name)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Branch
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {user.branch
                        ? `${user.branch.name}${user.branch.code ? ` (${user.branch.code})` : ""}`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Created
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Access
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {user.isActive ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleActive(user)}
                    disabled={loadingId === user.id}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingId === user.id
                      ? "Updating..."
                      : user.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>

                  <button
                    onClick={() => setResetUser(user)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition duration-200 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white shadow-sm">
                          {getInitials(user.firstName, user.lastName)}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {user.email}
                          </div>
                          {user.phone ? (
                            <div className="mt-1 text-xs text-slate-500">
                              {user.phone}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {formatRole(user.role?.name)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {user.branch
                        ? `${user.branch.name}${user.branch.code ? ` (${user.branch.code})` : ""}`
                        : "-"}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => router.push(`/users/${user.id}/edit`)}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleActive(user)}
                          disabled={loadingId === user.id}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingId === user.id
                            ? "Updating..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>

                        <button
                          onClick={() => setResetUser(user)}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                        0
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-900">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search query.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {resetUser && (
        <ResetPasswordDialog
          userId={resetUser.id}
          userName={`${resetUser.firstName} ${resetUser.lastName}`}
          onClose={() => setResetUser(null)}
        />
      )}
    </>
  );
}