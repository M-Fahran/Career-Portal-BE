import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import * as notificationService from '../service/notification.service';
import type { NotificationListQuery } from '../validators/notification.validator';

export const list = catchAsync(async (req: Request, res: Response) => {
  const notifications = await notificationService.getNotifications(
    req.user!.id,
    req.query as NotificationListQuery
  );

  res.status(200).json({ success: true, data: notifications });
});

export const unreadCount = catchAsync(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadNotificationCount(req.user!.id);
  res.status(200).json({ success: true, data: { count } });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user!.id,
    req.params.id as string
  );

  res.status(200).json({ success: true, data: notification });
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user!.id);
  res.status(200).json({ success: true, data: result });
});
