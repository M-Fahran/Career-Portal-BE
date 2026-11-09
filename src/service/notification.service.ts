import db from '../config/db';
import AppError from '../utils/AppError';
import type { NotificationListQuery } from '../validators/notification.validator';

const notificationInclude = {
  application: {
    select: {
      id: true,
      appliedAt: true,
      candidate: {
        select: {
          fullName: true,
          email: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

export const getNotifications = async (recipientId: string, query: NotificationListQuery) => {
  const where = {
    recipientId,
    ...(query.unreadOnly === 'true' ? { isRead: false } : {}),
  };
  const [notifications, total, unreadCount] = await db.$transaction([
    db.notification.findMany({
      where,
      include: notificationInclude,
      orderBy: { sentAt: 'desc' },
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { recipientId, isRead: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
  };
};

export const getUnreadNotificationCount = async (recipientId: string) => {
  return db.notification.count({
    where: { recipientId, isRead: false },
  });
};

export const markNotificationAsRead = async (recipientId: string, notificationId: string) => {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, recipientId },
    select: { id: true },
  });

  if (!notification) {
    throw new AppError('Notifikasi tidak ditemukan.', 404);
  }

  return db.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
    include: notificationInclude,
  });
};

export const markAllNotificationsAsRead = async (recipientId: string) => {
  const result = await db.notification.updateMany({
    where: { recipientId, isRead: false },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
};
