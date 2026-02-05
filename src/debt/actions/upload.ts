import type {
  UploadDebtInvoiceImages,
  UploadDebtPaymentProofImages,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type UploadImagesInput = {
  id: string;
  imageUrls: string[]; // Pre-uploaded URLs from client
};

// ============================================================================
// Upload Invoice Images
// ============================================================================

export const uploadDebtInvoiceImages: UploadDebtInvoiceImages<
  UploadImagesInput,
  { urls: string[] }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can upload invoice images');
  }

  // Get existing debt
  const debt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!debt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (debt.deletedAt) {
    throw new HttpError(400, 'Cannot update deleted debt');
  }

  // Validate URLs
  if (!args.imageUrls || args.imageUrls.length === 0) {
    throw new HttpError(400, 'At least one image URL is required');
  }

  // Update debt with new images (append to existing)
  const updatedImages = [...debt.invoiceImages, ...args.imageUrls];

  await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      invoiceImages: updatedImages,
    },
  });

  return {
    urls: args.imageUrls,
  };
};

// ============================================================================
// Upload Payment Proof Images
// ============================================================================

export const uploadDebtPaymentProofImages: UploadDebtPaymentProofImages<
  UploadImagesInput,
  { urls: string[] }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can upload payment proof images');
  }

  // Get existing debt
  const debt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!debt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (debt.deletedAt) {
    throw new HttpError(400, 'Cannot update deleted debt');
  }

  // Validate URLs
  if (!args.imageUrls || args.imageUrls.length === 0) {
    throw new HttpError(400, 'At least one image URL is required');
  }

  // Update debt with new images (append to existing)
  const updatedImages = [...debt.paymentProofImages, ...args.imageUrls];

  await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      paymentProofImages: updatedImages,
    },
  });

  return {
    urls: args.imageUrls,
  };
};

// ============================================================================
// NOTE: File upload to Cloudinary
// ============================================================================
// In the client, use a library like 'cloudinary' or direct upload widget
// to upload files and get URLs, then pass those URLs to these actions.
// 
// Example client-side flow:
// 1. User selects files
// 2. Upload to Cloudinary using upload widget or API
// 3. Get URLs from Cloudinary
// 4. Call uploadDebtInvoiceImages({ id, imageUrls: [...] })
