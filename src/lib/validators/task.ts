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

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: emptyToNull(z.string().trim().max(5000)).optional(),
  clientId: emptyToNull(z.string().trim().min(1)).optional(),
  assignedToId: z.string().trim().min(1, "Assigned user is required"),
  dueDate: emptyToNull(z.coerce.date()).optional(),
  status: emptyToUndefined(z.string().trim().min(1).max(100)),
  reminderEnabled: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: emptyToNull(z.string().trim().max(5000)).optional(),
  clientId: emptyToNull(z.string().trim().min(1)).optional(),
  assignedToId: z.string().trim().min(1).optional(),
  dueDate: emptyToNull(z.coerce.date()).optional(),
  status: z.string().trim().min(1).max(100).optional(),
  reminderEnabled: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required for update",
});