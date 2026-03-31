import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  email: z.string().trim().email("Valid email is required").optional(),
  phone: z.string().trim().nullable().optional(),
  roleId: z.string().min(1, "Role is required").optional(),
  branchId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

async function requireSuperAdminApi() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  const roleName = normalizeRole((session.user as any).roleName);

  if (roleName !== "super_admin") {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireSuperAdminApi();

    if (!auth.session) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await prisma.user.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleId: true,
        branchId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireSuperAdminApi();

    if (!auth.session) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid request body",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { id: userId } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.data.email) {
      const normalizedEmail = parsed.data.email.trim().toLowerCase();

      const duplicateUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
    }

    if (parsed.data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: parsed.data.roleId },
        select: { id: true },
      });

      if (!role) {
        return NextResponse.json({ error: "Selected role is invalid" }, { status: 400 });
      }
    }

    if (parsed.data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: parsed.data.branchId },
        select: { id: true },
      });

      if (!branch) {
        return NextResponse.json(
          { error: "Selected branch is invalid" },
          { status: 400 }
        );
      }
    }

    const currentUserId = (auth.session.user as any).id;

    if (userId === currentUserId && parsed.data.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.firstName !== undefined
          ? { firstName: parsed.data.firstName.trim() }
          : {}),
        ...(parsed.data.lastName !== undefined
          ? { lastName: parsed.data.lastName.trim() }
          : {}),
        ...(parsed.data.email !== undefined
          ? { email: parsed.data.email.trim().toLowerCase() }
          : {}),
        ...(parsed.data.phone !== undefined
          ? { phone: parsed.data.phone?.trim() || null }
          : {}),
        ...(parsed.data.roleId !== undefined
          ? { roleId: parsed.data.roleId }
          : {}),
        ...(parsed.data.branchId !== undefined
          ? { branchId: parsed.data.branchId || null }
          : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleId: true,
        branchId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}