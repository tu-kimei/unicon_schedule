export const getAllShipments = async (args: any, context: any) => {
  // TODO: Add user-based filtering if needed

  // Base query with relations
  const shipments = await context.entities.Shipment.findMany({
    include: {
      order: {
        include: {
          customer: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true
            }
          }
        }
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' },
        take: 5 // Latest 5 events
      },
      pods: {
        where: { isSubmitted: true },
        orderBy: { uploadedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return shipments;
};

export const getShipment = async ({ id }: { id: string }, context: any) => {
  // TODO: Add user-based authorization if needed

  const shipment = await context.entities.Shipment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true
            }
          }
        }
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' }
      },
      pods: {
        orderBy: { uploadedAt: 'desc' }
      }
    }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  return shipment;
};
