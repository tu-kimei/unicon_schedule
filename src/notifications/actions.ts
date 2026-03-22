// Notification Actions

interface MarkNotificationReadInput {
  notificationId: string;
}

export const markNotificationRead = async (args: MarkNotificationReadInput, context: any) => {
  const { user } = context;

  if (!user) {
    throw new Error('Chưa đăng nhập');
  }

  // Validate ownership
  const notification = await context.entities.Notification.findUnique({
    where: { id: args.notificationId }
  });

  if (!notification) {
    throw new Error('Không tìm thấy thông báo');
  }

  if (notification.userId !== user.id) {
    throw new Error('Unauthorized: You can only mark your own notifications as read');
  }

  const updated = await context.entities.Notification.update({
    where: { id: args.notificationId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return updated;
};

export const markAllNotificationsRead = async (_args: any, context: any) => {
  const { user } = context;

  if (!user) {
    throw new Error('Chưa đăng nhập');
  }

  const result = await context.entities.Notification.updateMany({
    where: {
      userId: user.id,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return { count: result.count };
};
