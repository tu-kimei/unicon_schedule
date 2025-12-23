export const getAvailableOrders = async (args: any, context: any) => {
  // Orders that can be used for new shipments
  const orders = await context.entities.Order.findMany({
    where: {
      status: 'CONFIRMED',
      deletedAt: null
    },
    include: {
      customer: true,
      shipments: {
        select: {
          id: true,
          currentStatus: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return orders;
};
