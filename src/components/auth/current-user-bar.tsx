import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function CurrentUserBar() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {session.user.firstName} {session.user.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {session.user.roleName}
          {session.user.branchName ? ` • ${session.user.branchName}` : ""}
        </p>
      </div>

      <SignOutButton />
    </div>
  );
}