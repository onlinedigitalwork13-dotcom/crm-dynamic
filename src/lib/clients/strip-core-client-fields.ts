type ProfileDataInput = Record<string, unknown> | null | undefined;

const CORE_CLIENT_KEYS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "passport",
  "passportNumber",
  "sourceId",
  "branchId",
  "workflowId",
  "currentStageId",
  "subagentId",
]);

export function stripCoreClientFields(profileData: ProfileDataInput) {
  if (!profileData || typeof profileData !== "object" || Array.isArray(profileData)) {
    return undefined;
  }

  const cleaned = Object.fromEntries(
    Object.entries(profileData).filter(([key]) => !CORE_CLIENT_KEYS.has(key))
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}