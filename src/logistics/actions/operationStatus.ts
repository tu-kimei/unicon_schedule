// Operation Status Actions - Shipment Flow Redesign

interface UpdateOperationStatusInput {
  shipmentId: string;
  operationStatus: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  description?: string;
}

// Valid operation status transitions
const validTransitions: Record<string, string[]> = {
  'DRAFT': ['PENDING', 'CANCELLED'],
  'PENDING': ['DISPATCHED', 'CANCELLED'],
  'DISPATCHED': ['IN_TRANSIT', 'CANCELLED'],
  'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],  // Terminal state
  'CANCELLED': []   // Terminal state
};

// Role permissions for each target status
const rolePermissions: Record<string, string[]> = {
  'PENDING': ['CUSTOMER_OPS', 'CUSTOMER_OWNER', 'OPS', 'ADMIN'],
  'DISPATCHED': ['DISPATCHER', 'OPS', 'ADMIN'],
  'IN_TRANSIT': ['DRIVER', 'ADMIN'],
  'DELIVERED': ['DRIVER', 'ADMIN'],
  'CANCELLED': ['CUSTOMER_OPS', 'CUSTOMER_OWNER', 'DISPATCHER', 'OPS', 'ADMIN']
};

// Map operationStatus to legacy currentStatus for backwards compatibility
function mapToLegacyStatus(operationStatus: string): string {
  const mapping: Record<string, string> = {
    'DRAFT': 'DRAFT',
    'PENDING': 'READY',
    'DISPATCHED': 'ASSIGNED',
    'IN_TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'COMPLETED',
    'CANCELLED': 'CANCELLED'
  };
  return mapping[operationStatus] || operationStatus;
}

export const updateOperationStatus = async (args: UpdateOperationStatusInput, context: any) => {
  const { user } = context;

  // Validate role permissions for the target status
  const allowedRoles = rolePermissions[args.operationStatus];
  if (!allowedRoles || !allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized: ${user.role} cannot set operation status to ${args.operationStatus}`);
  }

  // Get current shipment
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: {
      stops: true,
      customer: { include: { users: true } }
    }
  });

  if (!shipment) {
    throw new Error('Không tìm thấy chuyến hàng');
  }

  // Validate transition
  const allowed = validTransitions[shipment.operationStatus];
  if (!allowed || !allowed.includes(args.operationStatus)) {
    throw new Error(
      `Invalid operation status transition: ${shipment.operationStatus} -> ${args.operationStatus}`
    );
  }

  const legacyStatus = mapToLegacyStatus(args.operationStatus);
  const description = args.description || `Operation status changed to ${args.operationStatus}`;

  // Update shipment with both new and legacy status
  const updatedShipment = await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: {
      operationStatus: args.operationStatus,
      currentStatus: legacyStatus as any,
      actualStartDate: args.operationStatus === 'IN_TRANSIT' ? new Date() : shipment.actualStartDate,
      actualEndDate: args.operationStatus === 'DELIVERED' ? new Date() : shipment.actualEndDate
    },
    include: {
      customer: true,
      stops: { orderBy: { sequence: 'asc' } }
    }
  });

  // Create status event
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: args.shipmentId,
      status: legacyStatus as any,
      eventType: 'STATUS_CHANGE',
      description,
      createdById: user.id
    }
  });

  // Notify customer users for important transitions
  if (['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(args.operationStatus)) {
    const customerUsers = shipment.customer?.users || [];
    const notificationType = args.operationStatus === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED';
    for (const customerUser of customerUsers) {
      await context.entities.Notification.create({
        data: {
          userId: customerUser.id,
          type: notificationType,
          title: `Chuyến hàng ${args.operationStatus === 'DELIVERED' ? 'đã giao' : 'đang vận chuyển'}`,
          message: `Chuyến ${shipment.shipmentNumber} đã cập nhật trạng thái`,
          referenceId: args.shipmentId,
          referenceType: 'REF_SHIPMENT',
          channels: ['IN_APP']
        }
      });
    }
  }

  return updatedShipment;
};
