import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiError } from "@/lib/api-errors";

export async function requireApiAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiError("Unauthorized", 401);
  }

  if (!session.user.isActive) {
    throw new ApiError("Inactive account", 403);
  }

  return session;
}