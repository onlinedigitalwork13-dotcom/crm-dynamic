import { prisma } from "@/lib/prisma";

type LogClientActivityInput = {
  clientId: string;
  type: string;
  message: string;
};

export async function logClientActivity({
  clientId,
  type,
  message,
}: LogClientActivityInput) {
  return prisma.clientActivity.create({
    data: {
      clientId,
      type,
      message,
    },
  });
}