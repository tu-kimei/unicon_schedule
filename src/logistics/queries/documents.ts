import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

interface GetShipmentDocumentsInput {
  shipmentId: string;
}

// ============================================================================
// Queries
// ============================================================================

export const getShipmentDocuments = async (
  args: GetShipmentDocumentsInput,
  context: any
) => {
  const { user } = context;

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Validate shipment exists
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: { customer: { include: { users: true } } },
  });

  if (!shipment) {
    throw new HttpError(404, 'Shipment không tồn tại');
  }

  // Customer users can only see their own shipments' documents
  if (['CUSTOMER_OPS', 'CUSTOMER_OWNER'].includes(user.role)) {
    const isCustomerUser = shipment.customer.users.some(
      (u: any) => u.id === user.id
    );
    if (!isCustomerUser) {
      throw new HttpError(403, 'Bạn chỉ có thể xem tài liệu của shipment mình');
    }
  }

  const documents = await context.entities.ShipmentDocument.findMany({
    where: { shipmentId: args.shipmentId },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
      verifiedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: [
      { documentType: 'asc' },
      { uploadedAt: 'desc' },
    ],
  });

  return documents;
};
