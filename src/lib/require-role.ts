import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();

  const currentRole = normalizeRole(session.user.roleName);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(currentRole)) {
    redirect("/unauthorized");
  }

  return session;
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}