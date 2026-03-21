import { HttpError } from 'wasp/server';

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

interface CreateShipmentRequestInput {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  specialInstructions?: string;
  containerNumber?: string;
  containerType?: string;
  stops: ShipmentStopInput[];
}

// Customer creates shipment request
export const createShipmentRequest = async (args: CreateShipmentRequestInput, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Only customer users can create shipment requests');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'User is not linked to a customer');
  }

  // Validate customer is active
  const customer = await context.entities.Customer.findUnique({
    where: { id: user.customerId }
  });

  if (!customer || customer.status !== 'ACTIVE') {
    throw new HttpError(400, 'Customer must be active to create shipments');
  }

  // Validate stops
  if (!args.stops || args.stops.length === 0) {
    throw new HttpError(400, 'At least one stop is required');
  }

  // Check stop sequences are unique and start from 1
  const sequences = args.stops.map(s => s.sequence).sort();
  const hasDuplicates = sequences.some((seq, i) => seq === sequences[i - 1]);
  if (hasDuplicates || sequences[0] !== 1) {
    throw new HttpError(400, 'Stop sequences must be unique and start from 1');
  }

  // Validate dates
  if (args.plannedEndDate <= args.plannedStartDate) {
    throw new HttpError(400, 'End date must be after start date');
  }

  // Generate shipment number
  const shipmentCount = await context.entities.Shipment.count();
  const shipmentNumber = `SHP-${new Date().getFullYear()}-${String(shipmentCount + 1).padStart(4, '0')}`;

  // Create shipment request (status: DRAFT)
  const shipment = await context.entities.Shipment.create({
    data: {
      customerId: user.customerId,
      createdById: user.id,
      createdByType: 'CUSTOMER',
      shipmentNumber,
      currentStatus: 'DRAFT',
      priority: args.priority || 'NORMAL',
      plannedStartDate: args.plannedStartDate,
      plannedEndDate: args.plannedEndDate,
      specialInstructions: args.specialInstructions,
      containerNumber: args.containerNumber,
      containerType: args.containerType,
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
      customer: true,
      createdBy: {
        select: {
          fullName: true,
          email: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  return shipment;
};

// Customer updates shipment request (only when DRAFT)
export const updateShipmentRequest = async (
  args: { shipmentId: string } & Partial<CreateShipmentRequestInput>,
  context: any
) => {
  const { user } = context;
  const { shipmentId, ...updates } = args;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Only customer users can update shipment requests');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'User is not linked to a customer');
  }

  // Check shipment exists and belongs to customer
  const existingShipment = await context.entities.Shipment.findUnique({
    where: { id: shipmentId },
    include: { stops: true }
  });

  if (!existingShipment) {
    throw new HttpError(404, 'Shipment not found');
  }

  if (existingShipment.customerId !== user.customerId) {
    throw new HttpError(403, 'You do not have permission to update this shipment');
  }

  // Can only update DRAFT shipments
  if (existingShipment.currentStatus !== 'DRAFT') {
    throw new HttpError(400, 'Can only update shipments in DRAFT status');
  }

  // Build update data
  const updateData: any = {};
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.plannedStartDate) updateData.plannedStartDate = updates.plannedStartDate;
  if (updates.plannedEndDate) updateData.plannedEndDate = updates.plannedEndDate;
  if (updates.specialInstructions !== undefined) updateData.specialInstructions = updates.specialInstructions;
  if (updates.containerNumber !== undefined) updateData.containerNumber = updates.containerNumber;
  if (updates.containerType !== undefined) updateData.containerType = updates.containerType;

  // Update stops if provided
  if (updates.stops) {
    const sequences = updates.stops.map(s => s.sequence).sort();
    const hasDuplicates = sequences.some((seq, i) => seq === sequences[i - 1]);
    if (hasDuplicates || sequences[0] !== 1) {
      throw new HttpError(400, 'Stop sequences must be unique and start from 1');
    }

    updateData.stops = {
      deleteMany: {},
      create: updates.stops.map(stop => ({
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
    };
  }

  const shipment = await context.entities.Shipment.update({
    where: { id: shipmentId },
    data: updateData,
    include: {
      customer: true,
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  return shipment;
};

// Customer cancels shipment request
export const cancelShipmentRequest = async ({ shipmentId }: { shipmentId: string }, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Only customer users can cancel shipment requests');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'User is not linked to a customer');
  }

  // Check shipment exists and belongs to customer
  const existingShipment = await context.entities.Shipment.findUnique({
    where: { id: shipmentId }
  });

  if (!existingShipment) {
    throw new HttpError(404, 'Shipment not found');
  }

  if (existingShipment.customerId !== user.customerId) {
    throw new HttpError(403, 'You do not have permission to cancel this shipment');
  }

  // Can only cancel DRAFT or READY shipments
  if (!['DRAFT', 'READY'].includes(existingShipment.currentStatus)) {
    throw new HttpError(400, 'Can only cancel shipments in DRAFT or READY status');
  }

  // Update status to CANCELLED
  const shipment = await context.entities.Shipment.update({
    where: { id: shipmentId },
    data: {
      currentStatus: 'CANCELLED'
    },
    include: {
      customer: true,
      stops: true
    }
  });

  // Create status event
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: shipmentId,
      status: 'CANCELLED',
      eventType: 'STATUS_CHANGE',
      description: 'Shipment cancelled by customer',
      createdById: user.id
    }
  });

  return shipment;
};

// Customer confirms documents are complete
export const confirmDocuments = async ({ shipmentId }: { shipmentId: string }, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Only customer users can confirm documents');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'User is not linked to a customer');
  }

  // Check shipment exists and belongs to customer
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: shipmentId }
  });

  if (!shipment) {
    throw new HttpError(404, 'Shipment not found');
  }

  if (shipment.customerId !== user.customerId) {
    throw new HttpError(403, 'You do not have permission to access this shipment');
  }

  // Create status event for document confirmation
  const event = await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: shipmentId,
      status: shipment.currentStatus,
      eventType: 'NOTE',
      description: 'Customer confirmed all documents received',
      createdById: user.id
    }
  });

  return event;
};
