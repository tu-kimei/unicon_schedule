interface CreateShipmentInput {
  orderId: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  stops: ShipmentStopInput[];
}

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: Date;
  plannedDeparture: Date;
  specialInstructions?: string;
}

export const createShipment = async (args: CreateShipmentInput, context: any) => {
  const { user } = context;

  // Validate user permissions
  if (!['OPS', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized: Only OPS and ADMIN can create shipments');
  }

  // Validate order exists and is confirmed
  const order = await context.entities.Order.findUnique({
    where: { id: args.orderId }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'CONFIRMED') {
    throw new Error('Order must be confirmed to create shipment');
  }

  // Validate stops
  if (!args.stops || args.stops.length === 0) {
    throw new Error('At least one stop is required');
  }

  // Check stop sequences are unique and start from 1
  const sequences = args.stops.map(s => s.sequence).sort();
  const hasDuplicates = sequences.some((seq, i) => seq === sequences[i - 1]);
  if (hasDuplicates || sequences[0] !== 1) {
    throw new Error('Stop sequences must be unique and start from 1');
  }

  // Generate shipment number
  const shipmentCount = await context.entities.Shipment.count();
  const shipmentNumber = `SHP${String(shipmentCount + 1).padStart(6, '0')}`;

  // Create shipment and stops in transaction
  const shipment = await context.entities.Shipment.create({
    data: {
      orderId: args.orderId,
      shipmentNumber,
      currentStatus: 'DRAFT',
      priority: args.priority || 'NORMAL',
      plannedStartDate: args.plannedStartDate,
      plannedEndDate: args.plannedEndDate,
      stops: {
        create: args.stops.map(stop => ({
          sequence: stop.sequence,
          stopType: stop.stopType,
          locationName: stop.locationName,
          address: stop.address,
          contactPerson: stop.contactPerson,
          contactPhone: stop.contactPhone,
          plannedArrival: stop.plannedArrival,
          plannedDeparture: stop.plannedDeparture,
          specialInstructions: stop.specialInstructions
        }))
      }
    },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  return shipment;
};

interface UpdateShipmentInput {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  stops?: ShipmentStopInput[];
}

export const updateShipment = async (args: UpdateShipmentInput & { shipmentId: string }, context: any) => {
  const { user } = context;
  const { shipmentId } = args;

  // Validate user permissions
  if (!['OPS', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized: Only OPS and ADMIN can update shipments');
  }

  // Check shipment exists and is editable
  const existingShipment = await context.entities.Shipment.findUnique({
    where: { id: shipmentId },
    include: { stops: true }
  });

  if (!existingShipment) {
    throw new Error('Shipment not found');
  }

  if (['COMPLETED', 'CANCELLED'].includes(existingShipment.currentStatus)) {
    throw new Error('Cannot update completed or cancelled shipments');
  }

  // Update shipment
  const updateData: any = {};
  if (args.priority) updateData.priority = args.priority;
  if (args.plannedStartDate) updateData.plannedStartDate = args.plannedStartDate;
  if (args.plannedEndDate) updateData.plannedEndDate = args.plannedEndDate;

  let shipment;
  if (args.stops) {
    // Validate new stops
    const sequences = args.stops.map(s => s.sequence).sort();
    const hasDuplicates = sequences.some((seq, i) => seq === sequences[i - 1]);
    if (hasDuplicates || sequences[0] !== 1) {
      throw new Error('Stop sequences must be unique and start from 1');
    }

    // Replace all stops
    shipment = await context.entities.Shipment.update({
      where: { id: shipmentId },
      data: {
        ...updateData,
        stops: {
          deleteMany: {},
          create: args.stops.map(stop => ({
            sequence: stop.sequence,
            stopType: stop.stopType,
            locationName: stop.locationName,
            address: stop.address,
            contactPerson: stop.contactPerson,
            contactPhone: stop.contactPhone,
            plannedArrival: stop.plannedArrival,
            plannedDeparture: stop.plannedDeparture,
            specialInstructions: stop.specialInstructions
          }))
        }
      },
      include: {
        stops: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
  } else {
    shipment = await context.entities.Shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        stops: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
  }

  return shipment;
};
