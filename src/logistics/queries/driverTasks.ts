// DriverTask Queries - Shipment Flow Redesign

interface GetDriverTasksInput {
  shipmentId?: string;
}

interface GetDriverTasksByDriverInput {
  driverId?: string;
  date?: Date;
}

export const getDriverTasks = async (args: GetDriverTasksInput, context: any) => {
  const where: any = {};

  if (args?.shipmentId) {
    where.shipmentId = args.shipmentId;
  }

  const driverTasks = await context.entities.DriverTask.findMany({
    where,
    include: {
      driver: {
        include: { user: true, defaultTractor: true, defaultTrailer: true }
      },
      shipment: {
        include: {
          customer: true,
          stops: {
            orderBy: { sequence: 'asc' }
          }
        }
      },
      tractor: true,
      trailer: true
    },
    orderBy: { sequence: 'asc' }
  });

  return driverTasks;
};

export const getDriverTasksByDriver = async (args: GetDriverTasksByDriverInput, context: any) => {
  const { user } = context;
  const where: any = {};

  // DRIVER role auto-gets own tasks
  if (user.role === 'DRIVER') {
    const driver = await context.entities.Driver.findUnique({
      where: { userId: user.id }
    });
    if (!driver) {
      throw new Error('Driver profile not found for current user');
    }
    where.driverId = driver.id;
  } else if (args?.driverId) {
    where.driverId = args.driverId;
  }

  // Filter by date if provided
  if (args?.date) {
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    where.createdAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  const driverTasks = await context.entities.DriverTask.findMany({
    where,
    include: {
      driver: {
        include: { user: true, defaultTractor: true, defaultTrailer: true }
      },
      shipment: {
        include: {
          customer: true,
          stops: {
            orderBy: { sequence: 'asc' }
          }
        }
      },
      tractor: true,
      trailer: true
    },
    orderBy: { sequence: 'asc' }
  });

  return driverTasks;
};
