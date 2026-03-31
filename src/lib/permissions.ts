export function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function isSuperAdmin(roleName?: string | null) {
  return normalizeRole(roleName) === "super_admin";
}

export function isAdmin(roleName?: string | null) {
  const role = normalizeRole(roleName);
  return role === "admin" || role === "super_admin";
}

export function hasBranchScopedAccess(
  roleName?: string | null,
  userBranchId?: string | null,
  entityBranchId?: string | null
) {
  // Admins always have access
  if (isAdmin(roleName)) return true;

  // Non-admin must match branch
  if (!userBranchId || !entityBranchId) return false;

  return userBranchId === entityBranchId;
}