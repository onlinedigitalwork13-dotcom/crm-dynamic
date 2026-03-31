import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "") return null;
    return value;
  }, schema.nullable());

export const createClientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: emptyToNull(z.string().trim().email("Invalid email address").max(255)).optional(),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  passport: emptyToNull(z.string().trim().max(100)).optional(),
  branchId: emptyToNull(z.string().trim().min(1)).optional(),
  sourceId: emptyToNull(z.string().trim().min(1)).optional(),
  workflowId: emptyToNull(z.string().trim().min(1)).optional(),
  currentStageId: emptyToNull(z.string().trim().min(1)).optional(),
  subagentId: emptyToNull(z.string().trim().min(1)).optional(),

  profileData: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const updateClientSchema = createClientSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required for update",
  }
);

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;