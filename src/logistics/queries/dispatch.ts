export const getPendingShipments = async (args: any, context: any) => {
  // Shipments that need dispatch assignment
  const shipments = await context.entities.Shipment.findMany({
    where: {
      currentStatus: 'READY',
      dispatch: null, // Not yet assigned
      deletedAt: null
    },
    include: {
      order: {
        include: {
          customer: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      }
    },
    orderBy: { priority: 'desc' } // High priority first
  });

  return shipments;
};

export const getAvailableVehicles = async (args: any, context: any) => {
  const vehicles = await context.entities.Vehicle.findMany({
    where: {
      status: 'AVAILABLE'
    },
    orderBy: { vehicleType: 'asc' }
  });

  return vehicles;
};

export const getAvailableDrivers = async (args: any, context: any) => {
  const drivers = await context.entities.Driver.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      user: true
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  });

  return drivers;
};
