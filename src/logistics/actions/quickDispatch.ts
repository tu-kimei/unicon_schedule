import { HttpError } from 'wasp/server';

interface StopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  stopCategory?: string;
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
  shipmentType?: 'EXPORT' | 'IMPORT';
  priority: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  containerNumber?: string;
  containerType?: string;
  specialInstructions?: string;
  stops: StopInput[];
  tractorId: string;
  trailerId?: string;
  driverId: string;
  dispatchNotes?: string;
}

const REQUIRED_PHOTOS: Record<string, string[]> = {
  PICKUP_EMPTY: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'],
  WAREHOUSE_LOAD: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'],
  PORT_DELIVERY: ['PORT_GATE_PASS'],
  PORT_PICKUP: ['PORT_GATE_PASS'],
  WAREHOUSE_UNLOAD: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'],
  RETURN_EMPTY: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'],
};

export const createAndDispatchShipment = async (
  args: CreateAndDispatchShipmentInput,
  context: any
) => {
  const { user } = context;

  if (!user || !['ADMIN', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Không có quyền: Chỉ ADMIN và DISPATCHER mới có thể sử dụng điều phối nhanh');
  }

  // Validate customer
  const customer = await context.entities.Customer.findUnique({
    where: { id: args.customerId },
    include: { users: true },
  });
  if (!customer) throw new HttpError(404, 'Không tìm thấy khách hàng');
  if (customer.status !== 'ACTIVE') throw new HttpError(400, 'Khách hàng phải ở trạng thái hoạt động');

  // Validate stops
  if (!args.stops || args.stops.length === 0) {
    throw new HttpError(400, 'Cần ít nhất một điểm dừng');
  }

  // Validate tractor
  const tractor = await context.entities.Vehicle.findUnique({
    where: { id: args.tractorId },
  });
  if (!tractor) throw new HttpError(404, 'Không tìm thấy đầu kéo');
  if (tractor.vehicleType !== 'TRACTOR') throw new HttpError(400, 'Phương tiện phải là đầu kéo');
  if (tractor.status === 'OUT_OF_SERVICE') throw new HttpError(400, 'Đầu kéo đang ngưng hoạt động');

  // Validate trailer if provided
  let trailer = null;
  if (args.trailerId) {
    trailer = await context.entities.Vehicle.findUnique({
      where: { id: args.trailerId },
    });
    if (!trailer) throw new HttpError(404, 'Không tìm thấy rơ moóc');
    if (trailer.vehicleType !== 'TRAILER') throw new HttpError(400, 'Phương tiện phải là rơ moóc');
    if (trailer.status === 'OUT_OF_SERVICE') throw new HttpError(400, 'Rơ moóc đang ngưng hoạt động');
  }

  // Validate driver
  const driver = await context.entities.Driver.findUnique({
    where: { id: args.driverId },
    include: { user: true },
  });
  if (!driver) throw new HttpError(404, 'Không tìm thấy tài xế');
  if (driver.status !== 'ACTIVE') throw new HttpError(400, 'Tài xế không ở trạng thái hoạt động');

  // Generate shipment number
  const now = new Date();
  const year = now.getFullYear();
  const shipmentCount = await context.entities.Shipment.count();
  const sequenceNumber = String(shipmentCount + 1).padStart(4, '0');
  const shipmentNumber = `SHP-${year}-${sequenceNumber}`;

  // 1. Create shipment
  const shipment = await context.entities.Shipment.create({
    data: {
      customerId: args.customerId,
      shipmentNumber,
      currentStatus: 'ASSIGNED',
      operationStatus: 'DISPATCHED',
      shipmentType: args.shipmentType || null,
      priority: args.priority || 'NORMAL',
      plannedStartDate: new Date(args.plannedStartDate),
      plannedEndDate: new Date(args.plannedEndDate),
      createdById: user.id,
      createdByType: 'INTERNAL',
      specialInstructions: args.specialInstructions || null,
      containerNumber: args.containerNumber || null,
      containerType: args.containerType || null,
      stops: {
        create: args.stops.map((stop) => ({
          sequence: stop.sequence,
          stopType: stop.stopType,
          stopCategory: stop.stopCategory || null,
          requiredPhotos: stop.stopCategory ? (REQUIRED_PHOTOS[stop.stopCategory] || []) : [],
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

  // 2. Create DriverTask (thay vì Dispatch cũ)
  await context.entities.DriverTask.create({
    data: {
      shipmentId: shipment.id,
      driverId: args.driverId,
      tractorId: args.tractorId,
      trailerId: args.trailerId || null,
      sequence: 1,
      instructions: args.dispatchNotes || null,
    },
  });

  // 3. Create status event
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: shipment.id,
      status: 'ASSIGNED',
      eventType: 'STATUS_CHANGE',
      description: `Điều phối nhanh: Gán tài xế ${driver.fullName} với đầu kéo ${tractor.licensePlate}`,
      createdById: user.id,
    },
  });

  // 4. Notify driver
  if (driver.userId) {
    await context.entities.Notification.create({
      data: {
        userId: driver.userId,
        type: 'DISPATCHED',
        title: 'Chuyến mới được gán',
        message: `Bạn được gán chuyến ${shipmentNumber}`,
        referenceId: shipment.id,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP'],
      },
    });
  }

  // 5. Notify customer users
  const customerUsers = customer.users || [];
  for (const cu of customerUsers) {
    await context.entities.Notification.create({
      data: {
        userId: cu.id,
        type: 'DISPATCHED',
        title: 'Chuyến hàng đã được điều phối',
        message: `Chuyến ${shipmentNumber} đã được gán xe và tài xế`,
        referenceId: shipment.id,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP'],
      },
    });
  }

  // 6. Return full shipment
  return context.entities.Shipment.findUnique({
    where: { id: shipment.id },
    include: {
      customer: true,
      stops: { orderBy: { sequence: 'asc' } },
      driverTasks: {
        include: {
          driver: { include: { user: true } },
          tractor: true,
          trailer: true,
        },
      },
      statusEvents: { orderBy: { createdAt: 'desc' } },
    },
  });
};
