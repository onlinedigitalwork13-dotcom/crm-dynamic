import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

function normalizeRole(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function requireApiRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const currentRole = normalizeRole(
    (session.user as { roleName?: string; role?: string }).roleName ||
      (session.user as { roleName?: string; role?: string }).role ||
      ""
  );

  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(currentRole)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}