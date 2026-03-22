// DriverTask Actions - Shipment Flow Redesign

interface CreateDriverTaskInput {
  shipmentId: string;
  driverId: string;
  tractorId: string;
  trailerId?: string;
  sequence: number;
  instructions?: string;
}

interface UpdateDriverTaskSequenceInput {
  tasks: { id: string; sequence: number }[];
}

interface UpdateDriverTaskStatusInput {
  taskId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  stopUpdates?: {
    stopId: string;
    actualArrival?: Date;
    actualDeparture?: Date;
  }[];
}

export const createDriverTask = async (args: CreateDriverTaskInput, context: any) => {
  const { user } = context;

  // Validate permissions
  if (!['ADMIN', 'DISPATCHER'].includes(user.role)) {
    throw new Error('Unauthorized: Only ADMIN and DISPATCHER can create driver tasks');
  }

  // Validate shipment exists and is in correct status
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: {
      customer: {
        include: { users: true }
      }
    }
  });

  if (!shipment) {
    throw new Error('Không tìm thấy chuyến hàng');
  }

  if (!['DRAFT', 'READY', 'ASSIGNED'].includes(shipment.currentStatus)) {
    throw new Error('Shipment must be in DRAFT, READY, or ASSIGNED status to create driver tasks');
  }

  // Validate tractor is TRACTOR type and not OUT_OF_SERVICE
  const tractor = await context.entities.Vehicle.findUnique({
    where: { id: args.tractorId }
  });

  if (!tractor) {
    throw new Error('Tractor not found');
  }

  if (tractor.vehicleType !== 'TRACTOR') {
    throw new Error('Selected vehicle must be of TRACTOR type');
  }

  if (tractor.status === 'OUT_OF_SERVICE') {
    throw new Error('Tractor is out of service and cannot be assigned');
  }

  // Validate trailer if provided
  if (args.trailerId) {
    const trailer = await context.entities.Vehicle.findUnique({
      where: { id: args.trailerId }
    });

    if (!trailer) {
      throw new Error('Trailer not found');
    }

    if (trailer.vehicleType !== 'TRAILER') {
      throw new Error('Selected vehicle must be of TRAILER type');
    }

    if (trailer.status === 'OUT_OF_SERVICE') {
      throw new Error('Trailer is out of service and cannot be assigned');
    }
  }

  // Validate driver is ACTIVE
  const driver = await context.entities.Driver.findUnique({
    where: { id: args.driverId },
    include: { user: true }
  });

  if (!driver) {
    throw new Error('Không tìm thấy tài xế');
  }

  if (driver.status !== 'ACTIVE') {
    throw new Error('Tài xế không ở trạng thái hoạt động');
  }

  // Create DriverTask
  const driverTask = await context.entities.DriverTask.create({
    data: {
      shipmentId: args.shipmentId,
      driverId: args.driverId,
      tractorId: args.tractorId,
      trailerId: args.trailerId || null,
      sequence: args.sequence,
      instructions: args.instructions
    },
    include: {
      driver: { include: { user: true } },
      shipment: true,
      tractor: true,
      trailer: true
    }
  });

  // Update shipment status to ASSIGNED and operationStatus to DISPATCHED
  await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: {
      currentStatus: 'ASSIGNED',
      operationStatus: 'DISPATCHED'
    }
  });

  // Create status event
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: args.shipmentId,
      status: 'ASSIGNED',
      eventType: 'STATUS_CHANGE',
      description: `Đã phân công tài xế ${driver.fullName} với đầu kéo ${tractor.licensePlate}`,
      createdById: user.id
    }
  });

  // Send notification to driver
  if (driver.userId) {
    await context.entities.Notification.create({
      data: {
        userId: driver.userId,
        type: 'DISPATCHED',
        title: 'Chuyến mới được gán',
        message: `Bạn được gán chuyến ${shipment.shipmentNumber}`,
        referenceId: args.shipmentId,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP']
      }
    });
  }

  // Send notifications to all customer users
  const customerUsers = shipment.customer?.users || [];
  for (const customerUser of customerUsers) {
    await context.entities.Notification.create({
      data: {
        userId: customerUser.id,
        type: 'DISPATCHED',
        title: 'Chuyến hàng đã được điều phối',
        message: `Chuyến ${shipment.shipmentNumber} đã được gán tài xế ${driver.fullName}`,
        referenceId: args.shipmentId,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP']
      }
    });
  }

  return driverTask;
};

export const updateDriverTaskSequence = async (args: UpdateDriverTaskSequenceInput, context: any) => {
  const { user } = context;

  // Validate permissions
  if (!['ADMIN', 'DISPATCHER'].includes(user.role)) {
    throw new Error('Unauthorized: Only ADMIN and DISPATCHER can update driver task sequences');
  }

  if (!args.tasks || args.tasks.length === 0) {
    throw new Error('At least one task sequence update is required');
  }

  // Update each task sequence
  const updates: any[] = [];
  for (const task of args.tasks) {
    const updated = await context.entities.DriverTask.update({
      where: { id: task.id },
      data: { sequence: task.sequence }
    });
    updates.push(updated);
  }

  return updates;
};

export const updateDriverTaskStatus = async (args: UpdateDriverTaskStatusInput, context: any) => {
  const { user } = context;

  // Validate permissions
  if (!['ADMIN', 'DISPATCHER', 'DRIVER'].includes(user.role)) {
    throw new Error('Unauthorized: Only ADMIN, DISPATCHER, and DRIVER can update driver task status');
  }

  // Get the driver task
  const driverTask = await context.entities.DriverTask.findUnique({
    where: { id: args.taskId },
    include: {
      driver: { include: { user: true } },
      shipment: {
        include: {
          customer: { include: { users: true } },
          driverTasks: true,
          stops: true
        }
      }
    }
  });

  if (!driverTask) {
    throw new Error('Driver task not found');
  }

  // DRIVER can only update own tasks
  if (user.role === 'DRIVER') {
    const driver = await context.entities.Driver.findUnique({
      where: { userId: user.id }
    });
    if (!driver || driver.id !== driverTask.driverId) {
      throw new Error('Unauthorized: Drivers can only update their own tasks');
    }
  }

  const updateData: any = { status: args.status };

  if (args.status === 'IN_PROGRESS') {
    updateData.startedAt = new Date();

    // If shipment was ASSIGNED (DISPATCHED), move to IN_TRANSIT
    if (['ASSIGNED', 'READY'].includes(driverTask.shipment.currentStatus)) {
      await context.entities.Shipment.update({
        where: { id: driverTask.shipmentId },
        data: {
          currentStatus: 'IN_TRANSIT',
          operationStatus: 'IN_TRANSIT',
          actualStartDate: new Date()
        }
      });

      await context.entities.ShipmentStatusEvent.create({
        data: {
          shipmentId: driverTask.shipmentId,
          status: 'IN_TRANSIT',
          eventType: 'STATUS_CHANGE',
          description: `Tài xế ${driverTask.driver.fullName} bắt đầu vận chuyển`,
          createdById: user.id
        }
      });

      // Notify customer users
      const customerUsers = driverTask.shipment.customer?.users || [];
      for (const customerUser of customerUsers) {
        await context.entities.Notification.create({
          data: {
            userId: customerUser.id,
            type: 'STOP_CHECKIN',
            title: 'Đang vận chuyển',
            message: `Chuyến ${driverTask.shipment.shipmentNumber} đang được vận chuyển`,
            referenceId: driverTask.shipmentId,
            referenceType: 'REF_SHIPMENT',
            channels: ['IN_APP']
          }
        });
      }
    }
  }

  if (args.status === 'COMPLETED') {
    updateData.completedAt = new Date();

    // Check if ALL tasks for this shipment are completed
    const allTasks = driverTask.shipment.driverTasks;
    const otherPendingTasks = allTasks.filter(
      (t: any) => t.id !== args.taskId && t.status !== 'COMPLETED' && t.status !== 'SKIPPED'
    );

    if (otherPendingTasks.length === 0) {
      await context.entities.Shipment.update({
        where: { id: driverTask.shipmentId },
        data: {
          currentStatus: 'COMPLETED',
          operationStatus: 'DELIVERED',
          actualEndDate: new Date()
        }
      });

      await context.entities.ShipmentStatusEvent.create({
        data: {
          shipmentId: driverTask.shipmentId,
          status: 'COMPLETED',
          eventType: 'STATUS_CHANGE',
          description: 'Tất cả chuyến đã hoàn thành. Hàng đã giao.',
          createdById: user.id
        }
      });

      const customerUsers = driverTask.shipment.customer?.users || [];
      for (const customerUser of customerUsers) {
        await context.entities.Notification.create({
          data: {
            userId: customerUser.id,
            type: 'DELIVERED',
            title: 'Chuyến hàng hoàn tất',
            message: `Chuyến ${driverTask.shipment.shipmentNumber} đã giao thành công`,
            referenceId: driverTask.shipmentId,
            referenceType: 'REF_SHIPMENT',
            channels: ['IN_APP']
          }
        });
      }
    }
  }

  // Update stop times if provided
  if (args.stopUpdates && args.stopUpdates.length > 0) {
    for (const stopUpdate of args.stopUpdates) {
      const stopData: any = {};
      if (stopUpdate.actualArrival) stopData.actualArrival = stopUpdate.actualArrival;
      if (stopUpdate.actualDeparture) stopData.actualDeparture = stopUpdate.actualDeparture;

      await context.entities.ShipmentStop.update({
        where: { id: stopUpdate.stopId },
        data: stopData
      });
    }
  }

  // Update the driver task
  const updatedTask = await context.entities.DriverTask.update({
    where: { id: args.taskId },
    data: updateData,
    include: {
      driver: { include: { user: true } },
      shipment: { include: { customer: true, stops: true } },
      tractor: true,
      trailer: true
    }
  });

  return updatedTask;
};
