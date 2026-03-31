"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function UsersTable({ users }: Props) {
  const router = useRouter();
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to update user");
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
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Mobile cards */}
        <div className="divide-y divide-gray-100 md:hidden">
          {users.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="space-y-4 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="mt-1 break-all text-sm text-gray-600">
                      {user.email}
                    </div>
                    {user.phone ? (
                      <div className="mt-1 text-xs text-gray-500">{user.phone}</div>
                    ) : null}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Role
                    </p>
                    <p className="mt-1 text-gray-700">{user.role?.name || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Branch
                    </p>
                    <p className="mt-1 text-gray-700">
                      {user.branch
                        ? `${user.branch.name}${user.branch.code ? ` (${user.branch.code})` : ""}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleActive(user)}
                    disabled={loadingId === user.id}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loadingId === user.id
                      ? "Updating..."
                      : user.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>

                  <button
                    onClick={() => setResetUser(user)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.phone ? (
                        <div className="mt-1 text-xs text-gray-500">{user.phone}</div>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 text-gray-600">{user.email}</td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.role?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.branch
                        ? `${user.branch.name}${user.branch.code ? ` (${user.branch.code})` : ""}`
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => router.push(`/users/${user.id}/edit`)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleActive(user)}
                          disabled={loadingId === user.id}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {loadingId === user.id
                            ? "Updating..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>

                        <button
                          onClick={() => setResetUser(user)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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