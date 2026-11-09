import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
