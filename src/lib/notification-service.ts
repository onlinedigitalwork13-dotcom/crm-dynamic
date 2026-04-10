import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
};

type GetUserNotificationsOptions = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

function normalizePositiveInt(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId?.trim()) {
    throw new Error("userId is required");
  }

  if (!input.title?.trim()) {
    throw new Error("title is required");
  }

  if (!input.message?.trim()) {
    throw new Error("message is required");
  }

  if (!input.type?.trim()) {
    throw new Error("type is required");
  }

  return prisma.notification.create({
    data: {
      userId: input.userId.trim(),
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type.trim(),
      link: input.link?.trim() || null,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options: GetUserNotificationsOptions = {}
) {
  if (!userId?.trim()) {
    return {
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const page = normalizePositiveInt(options.page, 1);
  const limit = Math.min(normalizePositiveInt(options.limit, 20), 100);
  const unreadOnly = options.unreadOnly === true;

  const skip = (page - 1) * limit;

  const where = {
    userId: userId.trim(),
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: skip + notifications.length < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getUnreadNotificationCount(userId: string) {
  if (!userId?.trim()) {
    return 0;
  }

  return prisma.notification.count({
    where: {
      userId: userId.trim(),
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  if (!notificationId?.trim() || !userId?.trim()) {
    return { count: 0 };
  }

  return prisma.notification.updateMany({
    where: {
      id: notificationId.trim(),
      userId: userId.trim(),
    },
    data: {
      isRead: true,
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  if (!userId?.trim()) {
    return { count: 0 };
  }

  return prisma.notification.updateMany({
    where: {
      userId: userId.trim(),
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}