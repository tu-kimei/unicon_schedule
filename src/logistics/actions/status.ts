interface UpdateStatusInput {
  shipmentId: string;
  status: 'READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  description: string;
  location?: string;
  stopUpdates?: {
    stopId: string;
    actualArrival?: Date;
    actualDeparture?: Date;
  }[];
}

export const updateShipmentStatus = async (args: UpdateStatusInput, context: any) => {
  const { user } = context;

  // Validate permissions based on status transition
  const allowedRoles = getAllowedRolesForStatus(args.status);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized: ${user.role} cannot update shipment to ${args.status} status`);
  }

  // Validate status transition
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: { stops: true }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (!isValidTransition(shipment.currentStatus, args.status)) {
    throw new Error(`Invalid status transition: ${shipment.currentStatus} → ${args.status}`);
  }

  // For COMPLETED status, validate all stops have actual times
  if (args.status === 'COMPLETED') {
    const stopsWithoutActualTimes = shipment.stops.filter(
      (stop: any) => !stop.actualArrival || !stop.actualDeparture
    );
    if (stopsWithoutActualTimes.length > 0) {
      throw new Error('All stops must have actual arrival and departure times before completing shipment');
    }
  }

  // Update in transaction
  const result = await context.entities.$transaction(async (tx: any) => {
    // Update shipment status
    const updatedShipment = await tx.Shipment.update({
      where: { id: args.shipmentId },
      data: {
        currentStatus: args.status,
        actualStartDate: args.status === 'IN_TRANSIT' ? new Date() : shipment.actualStartDate,
        actualEndDate: args.status === 'COMPLETED' ? new Date() : shipment.actualEndDate
      }
    });

    // Update stop times if provided
    if (args.stopUpdates && args.stopUpdates.length > 0) {
      for (const stopUpdate of args.stopUpdates) {
        await tx.ShipmentStop.update({
          where: { id: stopUpdate.stopId },
          data: {
            actualArrival: stopUpdate.actualArrival,
            actualDeparture: stopUpdate.actualDeparture
          }
        });
      }
    }

    // Create status event
    const statusEvent = await tx.ShipmentStatusEvent.create({
      data: {
        shipmentId: args.shipmentId,
        status: args.status,
        eventType: 'STATUS_CHANGE',
        description: args.description,
        location: args.location,
        createdById: user.id
      }
    });

    return {
      shipment: updatedShipment,
      statusEvent,
      updatedStops: args.stopUpdates || []
    };
  });

  return result;
};

// Helper functions
function getAllowedRolesForStatus(status: string): string[] {
  const roleMatrix: Record<string, string[]> = {
    'READY': ['OPS', 'DISPATCHER', 'ADMIN'],
    'ASSIGNED': ['DISPATCHER', 'ADMIN'],
    'IN_TRANSIT': ['DRIVER', 'DISPATCHER', 'ADMIN'],
    'COMPLETED': ['DRIVER', 'DISPATCHER', 'ADMIN'],
    'CANCELLED': ['OPS', 'DISPATCHER', 'ADMIN']
  };
  return roleMatrix[status] || [];
}

function isValidTransition(current: string, next: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'DRAFT': ['READY', 'CANCELLED'],
    'READY': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['IN_TRANSIT', 'CANCELLED'],
    'IN_TRANSIT': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [], // Terminal state
    'CANCELLED': []  // Terminal state
  };

  return validTransitions[current]?.includes(next) || false;
}
