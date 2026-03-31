"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}