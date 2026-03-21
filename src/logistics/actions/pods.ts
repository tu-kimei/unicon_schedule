interface UploadPODInput {
  shipmentId: string;
  file: File;
  fileName: string;
  fileType: 'IMAGE_JPG' | 'IMAGE_PNG' | 'DOCUMENT_PDF';
  photoCategory?: 'CONTAINER_EXTERIOR' | 'CONTAINER_INTERIOR' | 'PORT_GATE_PASS' | 'WAREHOUSE_GATE_PASS' | 'WEIGHT_TICKET' | 'OTHER';
  stopId?: string;
}

export const uploadPOD = async (args: UploadPODInput, context: any) => {
  const { user } = context;

  // Validate permissions
  if (!['DRIVER', 'OPS', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized: Only DRIVER, OPS, and ADMIN can upload PODs');
  }

  // Validate shipment exists
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Validate stop belongs to shipment if provided
  let stop: any = null;
  if (args.stopId) {
    stop = await context.entities.ShipmentStop.findUnique({
      where: { id: args.stopId }
    });

    if (!stop || stop.shipmentId !== args.shipmentId) {
      throw new Error('Stop does not belong to this shipment');
    }

    // Validate photoCategory against stop's requiredPhotos if both are provided
    if (args.photoCategory && stop.requiredPhotos && stop.requiredPhotos.length > 0) {
      if (!stop.requiredPhotos.includes(args.photoCategory)) {
        throw new Error(
          `Photo category '${args.photoCategory}' is not valid for this stop. ` +
          `Required categories: ${stop.requiredPhotos.join(', ')}`
        );
      }
    }
  }

  // Validate file
  if (!args.file) {
    throw new Error('File is required');
  }

  // Check file size (5MB limit)
  if (args.file.size > 5 * 1024 * 1024) {
    throw new Error('File size must not exceed 5MB');
  }

  // Validate file type
  const allowedTypes = ['IMAGE_JPG', 'IMAGE_PNG', 'DOCUMENT_PDF'];
  if (!allowedTypes.includes(args.fileType)) {
    throw new Error('Unsupported file type');
  }

  // TODO: Upload file to external storage (S3/Cloud)
  // For now, we'll store the file path as a placeholder
  const filePath = `/uploads/pods/${Date.now()}-${args.fileName}`;

  // Create POD record
  const pod = await context.entities.POD.create({
    data: {
      shipmentId: args.shipmentId,
      stopId: args.stopId,
      fileName: args.fileName,
      filePath,
      fileType: args.fileType,
      photoCategory: args.photoCategory || null,
      fileSize: args.file.size,
      uploadedById: user.id
    }
  });

  // Notify customer users about the photo upload
  if (shipment.customerId) {
    const customerUsers = await context.entities.User.findMany({
      where: { customerId: shipment.customerId, isActive: true }
    });
    for (const cu of customerUsers) {
      await context.entities.Notification.create({
        data: {
          userId: cu.id,
          type: 'PHOTO_UPLOADED',
          title: 'Ảnh chứng từ mới',
          message: `Tài xế đã upload ảnh cho chuyến ${shipment.shipmentNumber}`,
          referenceId: args.shipmentId,
          referenceType: 'REF_SHIPMENT',
          channels: ['IN_APP'],
        }
      });
    }
  }

  return pod;
};
