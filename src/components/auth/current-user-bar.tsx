import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/auth/sign-out-button";

type SessionUserWithBranch = {
  firstName?: string | null;
  lastName?: string | null;
  roleName?: string | null;
  branchName?: string | null;
};

export default async function CurrentUserBar() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const user = session.user as typeof session.user & SessionUserWithBranch;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {user.roleName}
          {user.branchName ? ` • ${user.branchName}` : ""}
        </p>
      </div>

      <SignOutButton />
    </div>
  );
}