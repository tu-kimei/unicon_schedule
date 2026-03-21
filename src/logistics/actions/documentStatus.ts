// Document Status Actions - Shipment Flow Redesign

interface UpdateDocumentStatusInput {
  shipmentId: string;
  documentStatus: 'DOC_RECEIVED' | 'DOC_RETURNED';
  description?: string;
}

// Valid document status transitions
const validDocTransitions: Record<string, string[]> = {
  'DOC_PENDING': ['DOC_RECEIVED'],
  'DOC_RECEIVED': ['DOC_RETURNED'],
  'DOC_RETURNED': [] // Terminal state
};

export const updateDocumentStatus = async (args: UpdateDocumentStatusInput, context: any) => {
  const { user } = context;

  // Validate permissions - only ADMIN and OPS
  if (!['ADMIN', 'OPS'].includes(user.role)) {
    throw new Error('Unauthorized: Only ADMIN and OPS can update document status');
  }

  // Get current shipment
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: {
      customer: { include: { users: true } }
    }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Validate transition
  const allowed = validDocTransitions[shipment.documentStatus];
  if (!allowed || !allowed.includes(args.documentStatus)) {
    throw new Error(
      `Invalid document status transition: ${shipment.documentStatus} -> ${args.documentStatus}`
    );
  }

  const description = args.description || `Document status changed to ${args.documentStatus}`;

  // Update shipment document status
  const updatedShipment = await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: {
      documentStatus: args.documentStatus
    },
    include: {
      customer: true
    }
  });

  // On DOC_RETURNED, notify customer users
  if (args.documentStatus === 'DOC_RETURNED') {
    const customerUsers = shipment.customer?.users || [];
    for (const customerUser of customerUsers) {
      await context.entities.Notification.create({
        data: {
          userId: customerUser.id,
          type: 'DOC_RETURNED',
          title: 'Documents Returned',
          message: `Documents for shipment ${shipment.shipmentNumber} have been returned`,
          referenceId: args.shipmentId,
          referenceType: 'REF_DOCUMENT',
          channels: ['IN_APP']
        }
      });
    }
  }

  return updatedShipment;
};
