export function normalizeRole(role?: string | null) {
  return (role || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function isSuperAdmin(role?: string | null) {
  return normalizeRole(role) === "super_admin";
}