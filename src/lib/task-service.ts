import { prisma } from "@/lib/prisma";

export async function getAssignedToMe(userId: string) {
  return prisma.task.findMany({
    where: {
      assignedToId: userId,
    },
    include: {
      client: true,
      assignedTo: true,
      assignedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAssignedByMe(userId: string) {
  return prisma.task.findMany({
    where: {
      assignedById: userId,
    },
    include: {
      client: true,
      assignedTo: true,
      assignedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}