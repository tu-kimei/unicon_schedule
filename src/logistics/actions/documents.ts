import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type DocumentType =
  | 'BOOKING'
  | 'BILL_OF_LADING'
  | 'CUSTOMS'
  | 'DELIVERY_ORDER'
  | 'PACKING_LIST'
  | 'COMMERCIAL_INVOICE'
  | 'OTHER';

interface FileInput {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
}

interface UploadShipmentDocumentInput {
  shipmentId: string;
  documentType: DocumentType;
  files: FileInput[];
  notes?: string;
}

interface VerifyDocumentInput {
  documentId: string;
}

interface DeleteDocumentInput {
  documentId: string;
}

// ============================================================================
// Actions
// ============================================================================

export const uploadShipmentDocument = async (
  args: UploadShipmentDocumentInput,
  context: any
) => {
  const { user } = context;

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Permission check
  const allowedRoles = ['ADMIN', 'OPS', 'DISPATCHER', 'CUSTOMER_OPS', 'CUSTOMER_OWNER'];
  if (!allowedRoles.includes(user.role)) {
    throw new HttpError(403, 'Unauthorized: Bạn không có quyền tải tài liệu lên');
  }

  // Validate shipment exists
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: { customer: { include: { users: true } } },
  });

  if (!shipment) {
    throw new HttpError(404, 'Shipment không tồn tại');
  }

  // Customer users can only upload to their own shipments
  if (['CUSTOMER_OPS', 'CUSTOMER_OWNER'].includes(user.role)) {
    const isCustomerUser = shipment.customer.users.some(
      (u: any) => u.id === user.id
    );
    if (!isCustomerUser) {
      throw new HttpError(403, 'Bạn chỉ có thể tải tài liệu cho shipment của mình');
    }
  }

  // Validate files
  if (!args.files || args.files.length === 0) {
    throw new HttpError(400, 'Cần ít nhất một file');
  }

  // Create document records
  const documents = await Promise.all(
    args.files.map((file) =>
      context.entities.ShipmentDocument.create({
        data: {
          shipmentId: args.shipmentId,
          documentType: args.documentType,
          fileName: file.fileName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType || null,
          notes: args.notes || null,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      })
    )
  );

  return documents;
};

export const verifyDocument = async (
  args: VerifyDocumentInput,
  context: any
) => {
  const { user } = context;

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Only ADMIN and OPS can verify
  if (!['ADMIN', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Unauthorized: Chỉ ADMIN và OPS có thể xác minh tài liệu');
  }

  const document = await context.entities.ShipmentDocument.findUnique({
    where: { id: args.documentId },
  });

  if (!document) {
    throw new HttpError(404, 'Tài liệu không tồn tại');
  }

  if (document.isVerified) {
    throw new HttpError(400, 'Tài liệu đã được xác minh');
  }

  const updated = await context.entities.ShipmentDocument.update({
    where: { id: args.documentId },
    data: {
      isVerified: true,
      verifiedById: user.id,
      verifiedAt: new Date(),
    },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
      verifiedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return updated;
};

export const deleteDocument = async (
  args: DeleteDocumentInput,
  context: any
) => {
  const { user } = context;

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const document = await context.entities.ShipmentDocument.findUnique({
    where: { id: args.documentId },
  });

  if (!document) {
    throw new HttpError(404, 'Tài liệu không tồn tại');
  }

  // Cannot delete verified documents
  if (document.isVerified) {
    throw new HttpError(400, 'Không thể xóa tài liệu đã xác minh');
  }

  // Only ADMIN, OPS, or the uploader can delete
  const canDelete =
    ['ADMIN', 'OPS'].includes(user.role) ||
    document.uploadedById === user.id;

  if (!canDelete) {
    throw new HttpError(403, 'Bạn không có quyền xóa tài liệu này');
  }

  await context.entities.ShipmentDocument.delete({
    where: { id: args.documentId },
  });

  return { success: true, id: args.documentId };
};
