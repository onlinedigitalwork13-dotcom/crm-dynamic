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

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options: GetUserNotificationsOptions = {}
) {
  const page =
    typeof options.page === "number" && options.page > 0 ? options.page : 1;

  const limit =
    typeof options.limit === "number" && options.limit > 0
      ? Math.min(options.limit, 100)
      : 20;

  const unreadOnly = options.unreadOnly === true;

  const skip = (page - 1) * limit;

  const where = {
    userId,
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
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}