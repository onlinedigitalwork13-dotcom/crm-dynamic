import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  message?: string | null;
  metadata?: unknown;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}