// Notification Queries

interface GetNotificationsInput {
  limit?: number;
  offset?: number;
}

export const getNotifications = async (args: GetNotificationsInput, context: any) => {
  const { user } = context;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const limit = args?.limit || 20;
  const offset = args?.offset || 0;

  const notifications = await context.entities.Notification.findMany({
    where: { userId: user.id },
    orderBy: { sentAt: 'desc' },
    take: limit,
    skip: offset
  });

  return notifications;
};

export const getUnreadNotificationCount = async (_args: any, context: any) => {
  const { user } = context;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const count = await context.entities.Notification.count({
    where: {
      userId: user.id,
      isRead: false
    }
  });

  return count;
};
