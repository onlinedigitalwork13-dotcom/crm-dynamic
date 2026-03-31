import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "") return null;
    return value;
  }, schema.nullable());

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "") return undefined;
    return value;
  }, schema.optional());

export const createApplicationSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  providerId: z.string().trim().min(1, "Provider is required"),
  courseId: z.string().trim().min(1, "Course is required"),
  intake: z.string().trim().min(1, "Intake is required").max(100),
  intakeYear: emptyToNull(z.coerce.number().int().min(2000).max(2100)).optional(),
  status: emptyToUndefined(z.string().trim().min(1).max(100)),
  applicationNo: emptyToNull(z.string().trim().max(100)).optional(),
  notes: emptyToNull(z.string().trim().max(5000)).optional(),
  appliedAt: emptyToNull(z.coerce.date()).optional(),
  offerDate: emptyToNull(z.coerce.date()).optional(),
});

export const updateApplicationSchema = z.object({
  clientId: z.string().trim().min(1).optional(),
  providerId: z.string().trim().min(1).optional(),
  courseId: z.string().trim().min(1).optional(),
  intake: z.string().trim().min(1).max(100).optional(),
  intakeYear: emptyToNull(z.coerce.number().int().min(2000).max(2100)).optional(),
  status: z.string().trim().min(1).max(100).optional(),
  applicationNo: emptyToNull(z.string().trim().max(100)).optional(),
  notes: emptyToNull(z.string().trim().max(5000)).optional(),
  appliedAt: emptyToNull(z.coerce.date()).optional(),
  offerDate: emptyToNull(z.coerce.date()).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required for update",
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;