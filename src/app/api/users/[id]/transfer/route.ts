import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { transferUserWork } from "@/lib/user-transfer-service";

const transferUserSchema = z.object({
  toUserId: z.string().min(1, "Target user is required"),
  transferAssignedClients: z.boolean().optional().default(true),
  transferAssignedTasks: z.boolean().optional().default(true),
  transferAssignedLeads: z.boolean().optional().default(true),
  transferAssignedIntakeRequests: z.boolean().optional().default(true),
  transferAssignedIntakeSubmissions: z.boolean().optional().default(true),
  deactivateSourceUser: z.boolean().optional().default(true),
  notes: z.string().trim().nullable().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

async function requireTransferAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  const roleName = normalizeRole(
    (session.user as { roleName?: string; role?: string }).roleName ||
      (session.user as { roleName?: string; role?: string }).role ||
      ""
  );

  const allowed = roleName === "super_admin" || roleName === "admin";

  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return {
    ok: true as const,
    response: null,
    session,
  };
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireTransferAccess();

    if (!auth.ok || !auth.session) {
      return auth.response;
    }

    const { id: fromUserId } = await context.params;
    const body = await request.json();

    const parsed = transferUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid request body",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const actorUserId = (auth.session.user as { id?: string }).id;

    if (!actorUserId) {
      return NextResponse.json(
        { error: "Session user id is missing" },
        { status: 401 }
      );
    }

    if (
      parsed.data.deactivateSourceUser &&
      actorUserId === fromUserId
    ) {
      return NextResponse.json(
        { error: "You cannot transfer and deactivate your own account." },
        { status: 400 }
      );
    }

    const result = await transferUserWork({
      fromUserId,
      toUserId: parsed.data.toUserId,
      transferredByUserId: actorUserId,
      transferAssignedClients: parsed.data.transferAssignedClients,
      transferAssignedTasks: parsed.data.transferAssignedTasks,
      transferAssignedLeads: parsed.data.transferAssignedLeads,
      transferAssignedIntakeRequests: parsed.data.transferAssignedIntakeRequests,
      transferAssignedIntakeSubmissions:
        parsed.data.transferAssignedIntakeSubmissions,
      deactivateSourceUser: parsed.data.deactivateSourceUser,
      notes: parsed.data.notes ?? null,
    });

    return NextResponse.json({
      success: true,
      message: "User work transferred successfully",
      result,
    });
  } catch (error) {
    console.error("POST /api/users/[id]/transfer error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to transfer user work",
      },
      { status: 500 }
    );
  }
}