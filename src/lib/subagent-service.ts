import { prisma } from "@/lib/prisma";

export async function getSubagents() {
  return prisma.subagent.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}