type FormValues = Record<string, string>;

type MapClientInput = {
  values: FormValues;
  sourceId?: string | null;
  branchId?: string | null;
  workflowId?: string | null;
  currentStageId?: string | null;
  subagentId?: string | null;
};

type MappedClientData = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  passport: string | null;
  sourceId?: string | null;
  branchId?: string | null;
  workflowId?: string | null;
  currentStageId?: string | null;
  subagentId?: string | null;
  profileData: Record<string, string>;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function emptyToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

export function mapFormValuesToClient(input: MapClientInput): MappedClientData {
  const values = input.values ?? {};

  const firstName = cleanString(values.firstName);
  const lastName = cleanString(values.lastName);
  const email = emptyToNull(cleanString(values.email));
  const phone = cleanString(values.phone);
  const passport = emptyToNull(
    cleanString(values.passport ?? values.passportNumber ?? "")
  );

  const excludedKeys = new Set([
    "firstName",
    "lastName",
    "email",
    "phone",
    "passport",
    "passportNumber",
  ]);

  const profileData = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => {
      if (excludedKeys.has(key)) return false;
      return typeof value === "string";
    })
  );

  return {
    firstName,
    lastName,
    email,
    phone,
    passport,
    sourceId: input.sourceId ?? null,
    branchId: input.branchId ?? null,
    workflowId: input.workflowId ?? null,
    currentStageId: input.currentStageId ?? null,
    subagentId: input.subagentId ?? null,
    profileData,
  };
}