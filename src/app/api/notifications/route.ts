import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/lib/notification-service";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [{ notifications, pagination }, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, {
        page,
        limit,
        unreadOnly,
      }),
      getUnreadNotificationCount(session.user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}