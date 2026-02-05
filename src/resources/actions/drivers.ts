import type { Driver } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

type CreateDriverInput = {
  userId: string;
  fullName: string;
  phone: string;
  citizenIdImages: string[];
  birthYear?: number;
  hometown?: string;
  licenseImages: string[];
  licenseExpiry: string;
  status: DriverStatus;
};

type UpdateDriverInput = {
  id: string;
  fullName?: string;
  phone?: string;
  citizenIdImages?: string[];
  birthYear?: number;
  hometown?: string;
  licenseImages?: string[];
  licenseExpiry?: string;
  status?: DriverStatus;
};

type DeleteDriverInput = {
  id: string;
};

// ============================================================================
// Create Driver
// ============================================================================

export const createDriver = async (args: CreateDriverInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'OPS', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN, OPS, and DISPATCHER can create drivers');
  }

  // Validate userId exists and is not already a driver
  const existingUser = await context.entities.User.findUnique({
    where: { id: args.userId },
    include: { driver: true },
  });

  if (!existingUser) {
    throw new HttpError(404, 'User not found');
  }

  if (existingUser.driver) {
    throw new HttpError(400, 'User is already a driver');
  }

  // Create driver
  const driver = await context.entities.Driver.create({
    data: {
      userId: args.userId,
      fullName: args.fullName,
      phone: args.phone,
      citizenIdImages: args.citizenIdImages,
      birthYear: args.birthYear,
      hometown: args.hometown,
      licenseImages: args.licenseImages,
      licenseExpiry: new Date(args.licenseExpiry),
      status: args.status,
    },
  });

  return driver;
};

// ============================================================================
// Update Driver
// ============================================================================

export const updateDriver = async (args: UpdateDriverInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'OPS', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN, OPS, and DISPATCHER can update drivers');
  }

  // Get existing driver
  const existingDriver = await context.entities.Driver.findUnique({
    where: { id: args.id },
  });

  if (!existingDriver) {
    throw new HttpError(404, 'Driver not found');
  }

  // Build update data
  const updateData: any = {};
  if (args.fullName !== undefined) updateData.fullName = args.fullName;
  if (args.phone !== undefined) updateData.phone = args.phone;
  if (args.citizenIdImages !== undefined) updateData.citizenIdImages = args.citizenIdImages;
  if (args.birthYear !== undefined) updateData.birthYear = args.birthYear;
  if (args.hometown !== undefined) updateData.hometown = args.hometown;
  if (args.licenseImages !== undefined) updateData.licenseImages = args.licenseImages;
  if (args.licenseExpiry !== undefined) updateData.licenseExpiry = new Date(args.licenseExpiry);
  if (args.status !== undefined) updateData.status = args.status;

  // Update driver
  const updatedDriver = await context.entities.Driver.update({
    where: { id: args.id },
    data: updateData,
  });

  return updatedDriver;
};

// ============================================================================
// Delete Driver
// ============================================================================

export const deleteDriver = async (args: DeleteDriverInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN can delete drivers');
  }

  // Get existing driver
  const existingDriver = await context.entities.Driver.findUnique({
    where: { id: args.id },
    include: {
      dispatches: true,
    },
  });

  if (!existingDriver) {
    throw new HttpError(404, 'Driver not found');
  }

  // Check if driver has dispatches
  if (existingDriver.dispatches.length > 0) {
    throw new HttpError(400, 'Cannot delete driver with existing dispatches');
  }

  // Delete driver
  const deletedDriver = await context.entities.Driver.delete({
    where: { id: args.id },
  });

  return deletedDriver;
};
