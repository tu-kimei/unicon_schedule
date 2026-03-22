interface CreateShipmentInput {
  customerId: string;
  shipmentType?: 'EXPORT' | 'IMPORT';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  containerNumber?: string;
  containerType?: string;
  specialInstructions?: string;
  stops: ShipmentStopInput[];
}

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  stopCategory?: string;
  requiredPhotos?: string[];
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: Date;
  plannedDeparture: Date;
  specialInstructions?: string;
}

const STOP_TEMPLATES = {
  EXPORT: [
    { sequence: 1, stopCategory: 'PICKUP_EMPTY', stopType: 'DEPOT' as const, requiredPhotos: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_LOAD', stopType: 'PICKUP' as const, requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'PORT_DELIVERY', stopType: 'PORT' as const, requiredPhotos: ['PORT_GATE_PASS'] },
  ],
  IMPORT: [
    { sequence: 1, stopCategory: 'PORT_PICKUP', stopType: 'PORT' as const, requiredPhotos: ['PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_UNLOAD', stopType: 'DROPOFF' as const, requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'RETURN_EMPTY', stopType: 'DEPOT' as const, requiredPhotos: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'] },
  ],
};

export const createShipment = async (args: CreateShipmentInput, context: any) => {
  const { user } = context;

  // Validate user permissions
  if (!['OPS', 'ADMIN', 'DISPATCHER'].includes(user.role)) {
    throw new Error('Unauthorized: Only OPS, ADMIN, and DISPATCHER can create shipments');
  }

  // Validate customer exists
  const customer = await context.entities.Customer.findUnique({
    where: { id: args.customerId }
  });

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng');
  }

  if (customer.status !== 'ACTIVE') {
    throw new Error('Customer must be active to create shipment');
  }

  // Validate stops
  if (!args.stops || args.stops.length === 0) {
    throw new Error('Cần ít nhất một điểm dừng');
  }

  // Check stop sequences are unique and start from 1
  const sequences = args.stops.map(s => s.sequence).sort();
  const hasDuplicates = sequences.some((seq, i) => seq === sequences[i - 1]);
  if (hasDuplicates || sequences[0] !== 1) {
    throw new Error('Thứ tự điểm dừng phải là duy nhất và bắt đầu từ 1');
  }

  // Generate shipment number
  const shipmentCount = await context.entities.Shipment.count();
  const shipmentNumber = `SHP${String(shipmentCount + 1).padStart(6, '0')}`;

  // Build stops: merge template with provided data if shipmentType is set
  let stopsToCreate: any[];
  if (args.shipmentType && STOP_TEMPLATES[args.shipmentType]) {
    const templates = STOP_TEMPLATES[args.shipmentType];
    stopsToCreate = templates.map((template) => {
      const providedStop = args.stops.find(s => s.sequence === template.sequence);
      return {
        sequence: template.sequence,
        stopType: template.stopType,
        stopCategory: template.stopCategory,
        requiredPhotos: template.requiredPhotos,
        locationName: providedStop?.locationName || '',
        address: providedStop?.address || '',
        contactPerson: providedStop?.contactPerson || null,
        contactPhone: providedStop?.contactPhone || null,
        plannedArrival: new Date(providedStop?.plannedArrival || args.plannedStartDate),
        plannedDeparture: new Date(providedStop?.plannedDeparture || args.plannedEndDate),
        specialInstructions: providedStop?.specialInstructions || null,
      };
    });
  } else {
    stopsToCreate = args.stops.map(stop => ({
      sequence: stop.sequence,
      stopType: stop.stopType,
      stopCategory: stop.stopCategory || null,
      requiredPhotos: stop.requiredPhotos || [],
      locationName: stop.locationName,
      address: stop.address,
      contactPerson: stop.contactPerson || null,
      contactPhone: stop.contactPhone || null,
      plannedArrival: new Date(stop.plannedArrival),
      plannedDeparture: new Date(stop.plannedDeparture),
      specialInstructions: stop.specialInstructions || null,
    }));
  }

  // Create shipment and stops in transaction
  const shipment = await context.entities.Shipment.create({
    data: {
      customerId: args.customerId,
      shipmentNumber,
      currentStatus: 'DRAFT',
      operationStatus: 'DRAFT',
      ...(args.shipmentType ? { shipmentType: args.shipmentType } : {}),
      priority: args.priority || 'NORMAL',
      plannedStartDate: new Date(args.plannedStartDate),
      plannedEndDate: new Date(args.plannedEndDate),
      containerNumber: args.containerNumber || null,
      containerType: args.containerType || null,
      specialInstructions: args.specialInstructions || null,
      createdById: user.id,
      createdByType: 'INTERNAL',
      stops: {
        create: stopsToCreate
      }
    },
    include: {
      customer: true,
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
    throw new Error('Không tìm thấy chuyến hàng');
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
      throw new Error('Thứ tự điểm dừng phải là duy nhất và bắt đầu từ 1');
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
