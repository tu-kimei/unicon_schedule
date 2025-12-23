interface CreateDispatchInput {
  shipmentId: string;
  vehicleId: string;
  driverId: string;
  notes?: string;
}

export const createDispatch = async (args: CreateDispatchInput, context: any) => {
  const { user } = context;

  // Validate user permissions
  if (!['DISPATCHER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized: Only DISPATCHER and ADMIN can create dispatches');
  }

  // Check shipment exists and is ready for dispatch
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: { dispatch: true }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.currentStatus !== 'READY') {
    throw new Error('Shipment must be in READY status to assign dispatch');
  }

  if (shipment.dispatch) {
    throw new Error('Shipment already has a dispatch assigned');
  }

  // Validate vehicle is available
  const vehicle = await context.entities.Vehicle.findUnique({
    where: { id: args.vehicleId }
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  if (vehicle.status !== 'AVAILABLE') {
    throw new Error('Vehicle is not available');
  }

  // Validate driver is active
  const driver = await context.entities.Driver.findUnique({
    where: { id: args.driverId },
    include: { user: true }
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  if (driver.status !== 'ACTIVE') {
    throw new Error('Driver is not active');
  }

  // Create dispatch in transaction
  const result = await context.entities.$transaction(async (tx: any) => {
    // Create dispatch
    const dispatch = await tx.Dispatch.create({
      data: {
        shipmentId: args.shipmentId,
        vehicleId: args.vehicleId,
        driverId: args.driverId,
        assignedById: user.id,
        notes: args.notes
      },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    // Update vehicle status to IN_USE
    await tx.Vehicle.update({
      where: { id: args.vehicleId },
      data: { status: 'IN_USE' }
    });

    // Update shipment status to ASSIGNED
    await tx.Shipment.update({
      where: { id: args.shipmentId },
      data: { currentStatus: 'ASSIGNED' }
    });

    // Create status event
    await tx.ShipmentStatusEvent.create({
      data: {
        shipmentId: args.shipmentId,
        status: 'ASSIGNED',
        eventType: 'STATUS_CHANGE',
        description: `Shipment assigned to vehicle ${vehicle.licensePlate} and driver ${driver.user.fullName}`,
        createdById: user.id
      }
    });

    return dispatch;
  });

  return result;
};
