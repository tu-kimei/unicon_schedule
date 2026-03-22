import { HttpError } from 'wasp/server';

interface StopInput {
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

interface CreateAndDispatchShipmentInput {
  customerId: string;
  priority: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  containerNumber?: string;
  containerType?: string;
  specialInstructions?: string;
  stops: StopInput[];
  vehicleId: string;
  driverId: string;
  dispatchNotes?: string;
}

export const createAndDispatchShipment = async (
  args: CreateAndDispatchShipmentInput,
  context: any
) => {
  const { user } = context;

  // Permission check: ADMIN or DISPATCHER only
  if (!user || !['ADMIN', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Không có quyền: Chỉ ADMIN và DISPATCHER mới có thể sử dụng điều phối nhanh');
  }

  // Validate customer
  const customer = await context.entities.Customer.findUnique({
    where: { id: args.customerId },
  });
  if (!customer) {
    throw new HttpError(404, 'Không tìm thấy khách hàng');
  }
  if (customer.status !== 'ACTIVE') {
    throw new HttpError(400, 'Khách hàng phải ở trạng thái hoạt động');
  }

  // Validate stops
  if (!args.stops || args.stops.length === 0) {
    throw new HttpError(400, 'Cần ít nhất một điểm dừng');
  }

  // Validate vehicle
  const vehicle = await context.entities.Vehicle.findUnique({
    where: { id: args.vehicleId },
  });
  if (!vehicle) {
    throw new HttpError(404, 'Không tìm thấy phương tiện');
  }
  if (vehicle.status === 'OUT_OF_SERVICE') {
    throw new HttpError(400, 'Phương tiện đang ngưng hoạt động');
  }
  if (vehicle.status === 'MAINTENANCE') {
    throw new HttpError(400, 'Phương tiện đang bảo trì');
  }

  // Validate driver
  const driver = await context.entities.Driver.findUnique({
    where: { id: args.driverId },
    include: { user: true },
  });
  if (!driver) {
    throw new HttpError(404, 'Không tìm thấy tài xế');
  }
  if (driver.status !== 'ACTIVE') {
    throw new HttpError(400, 'Tài xế không ở trạng thái hoạt động');
  }

  // Generate shipment number: SHP-YYYY-XXXX
  const now = new Date();
  const year = now.getFullYear();
  const shipmentCount = await context.entities.Shipment.count();
  const sequenceNumber = String(shipmentCount + 1).padStart(4, '0');
  const shipmentNumber = `SHP-${year}-${sequenceNumber}`;

  // 1. Create shipment with status ASSIGNED and createdByType INTERNAL
  const shipment = await context.entities.Shipment.create({
    data: {
      customerId: args.customerId,
      shipmentNumber,
      currentStatus: 'ASSIGNED',
      priority: args.priority || 'NORMAL',
      plannedStartDate: new Date(args.plannedStartDate),
      plannedEndDate: new Date(args.plannedEndDate),
      createdById: user.id,
      createdByType: 'INTERNAL',
      specialInstructions: args.specialInstructions || null,
      containerNumber: args.containerNumber || null,
      containerType: args.containerType || null,
      // 2. Create stops
      stops: {
        create: args.stops.map((stop) => ({
          sequence: stop.sequence,
          stopType: stop.stopType,
          locationName: stop.locationName,
          address: stop.address,
          contactPerson: stop.contactPerson || null,
          contactPhone: stop.contactPhone || null,
          plannedArrival: new Date(stop.plannedArrival),
          plannedDeparture: new Date(stop.plannedDeparture),
          specialInstructions: stop.specialInstructions || null,
        })),
      },
    },
  });

  // 3. Create dispatch record
  await context.entities.Dispatch.create({
    data: {
      shipmentId: shipment.id,
      vehicleId: args.vehicleId,
      driverId: args.driverId,
      assignedById: user.id,
      notes: args.dispatchNotes || null,
    },
  });

  // 4. Create status event (ASSIGNED)
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: shipment.id,
      status: 'ASSIGNED',
      eventType: 'STATUS_CHANGE',
      description: `Quick dispatch: Shipment created and assigned to vehicle ${vehicle.licensePlate} and driver ${driver.fullName}`,
      createdById: user.id,
    },
  });

  // 5. Return shipment with relations
  const result = await context.entities.Shipment.findUnique({
    where: { id: shipment.id },
    include: {
      customer: true,
      stops: {
        orderBy: { sequence: 'asc' },
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: {
            include: { user: true },
          },
        },
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return result;
};
