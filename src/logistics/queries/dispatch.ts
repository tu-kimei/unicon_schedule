export const getPendingShipments = async (args: any, context: any) => {
  // Shipments that need dispatch assignment:
  // - READY status (internal shipments ready for dispatch)
  // - DRAFT status from customers (customer requests awaiting dispatch)
  const shipments = await context.entities.Shipment.findMany({
    where: {
      currentStatus: { in: ['READY', 'DRAFT'] },
      dispatch: null, // Not yet assigned
      deletedAt: null
    },
    include: {
      customer: true,
      stops: {
        orderBy: { sequence: 'asc' }
      }
    },
    orderBy: [
      { priority: 'desc' }, // High priority first
      { createdAt: 'asc' }  // Oldest first within same priority
    ]
  });

  return shipments;
};

export const getAvailableVehicles = async (args: any, context: any) => {
  // Get vehicles that are IN_USE (available for assignment)
  // Exclude MAINTENANCE and OUT_OF_SERVICE
  const vehicles = await context.entities.Vehicle.findMany({
    where: {
      status: 'IN_USE'
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
      user: true,
      defaultTractor: true,
      defaultTrailer: true,
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  });

  return drivers;
};
