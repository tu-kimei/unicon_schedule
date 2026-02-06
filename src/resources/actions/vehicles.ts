import type { Vehicle } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type VehicleType = 'TRACTOR' | 'TRAILER';
type VehicleStatus = 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
type VehicleCompany = 'KHANH_HUY' | 'UNICON';

type CreateVehicleInput = {
  licensePlate: string;
  vehicleType: VehicleType;
  manufacturingYear?: number;
  status: VehicleStatus;
  registrationImages: string[];
  inspectionImages: string[];
  insuranceImages: string[];
  operationExpiryDate: string;
  inspectionExpiryDate: string;
  insuranceExpiryDate: string;
  company: VehicleCompany;
  currentLocation?: string;
};

type UpdateVehicleInput = {
  id: string;
  licensePlate?: string;
  vehicleType?: VehicleType;
  manufacturingYear?: number;
  status?: VehicleStatus;
  registrationImages?: string[];
  inspectionImages?: string[];
  insuranceImages?: string[];
  operationExpiryDate?: string;
  inspectionExpiryDate?: string;
  insuranceExpiryDate?: string;
  company?: VehicleCompany;
  currentLocation?: string;
};

type DeleteVehicleInput = {
  id: string;
};

// ============================================================================
// Create Vehicle
// ============================================================================

export const createVehicle = async (args: CreateVehicleInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'OPS', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN, OPS, and DISPATCHER can create vehicles');
  }

  // Validate license plate uniqueness
  const existingVehicle = await context.entities.Vehicle.findUnique({
    where: { licensePlate: args.licensePlate },
  });

  if (existingVehicle) {
    throw new HttpError(400, 'License plate already exists');
  }

  // Create vehicle
  const vehicle = await context.entities.Vehicle.create({
    data: {
      licensePlate: args.licensePlate,
      vehicleType: args.vehicleType,
      manufacturingYear: args.manufacturingYear,
      status: args.status,
      registrationImages: args.registrationImages,
      inspectionImages: args.inspectionImages,
      insuranceImages: args.insuranceImages,
      operationExpiryDate: new Date(args.operationExpiryDate),
      inspectionExpiryDate: new Date(args.inspectionExpiryDate),
      insuranceExpiryDate: new Date(args.insuranceExpiryDate),
      company: args.company,
      currentLocation: args.currentLocation,
    },
  });

  return vehicle;
};

// ============================================================================
// Update Vehicle
// ============================================================================

export const updateVehicle = async (args: UpdateVehicleInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'OPS', 'DISPATCHER'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN, OPS, and DISPATCHER can update vehicles');
  }

  // Get existing vehicle
  const existingVehicle = await context.entities.Vehicle.findUnique({
    where: { id: args.id },
  });

  if (!existingVehicle) {
    throw new HttpError(404, 'Vehicle not found');
  }

  // Validate license plate uniqueness if changing
  if (args.licensePlate && args.licensePlate !== existingVehicle.licensePlate) {
    const plateExists = await context.entities.Vehicle.findUnique({
      where: { licensePlate: args.licensePlate },
    });

    if (plateExists) {
      throw new HttpError(400, 'License plate already exists');
    }
  }

  // Build update data
  const updateData: any = {};
  if (args.licensePlate !== undefined) updateData.licensePlate = args.licensePlate;
  if (args.vehicleType !== undefined) updateData.vehicleType = args.vehicleType;
  if (args.manufacturingYear !== undefined) updateData.manufacturingYear = args.manufacturingYear;
  if (args.status !== undefined) updateData.status = args.status;
  if (args.registrationImages !== undefined) updateData.registrationImages = args.registrationImages;
  if (args.inspectionImages !== undefined) updateData.inspectionImages = args.inspectionImages;
  if (args.insuranceImages !== undefined) updateData.insuranceImages = args.insuranceImages;
  if (args.operationExpiryDate !== undefined) updateData.operationExpiryDate = new Date(args.operationExpiryDate);
  if (args.inspectionExpiryDate !== undefined) updateData.inspectionExpiryDate = new Date(args.inspectionExpiryDate);
  if (args.insuranceExpiryDate !== undefined) updateData.insuranceExpiryDate = new Date(args.insuranceExpiryDate);
  if (args.company !== undefined) updateData.company = args.company;
  if (args.currentLocation !== undefined) updateData.currentLocation = args.currentLocation;

  // Update vehicle
  const updatedVehicle = await context.entities.Vehicle.update({
    where: { id: args.id },
    data: updateData,
  });

  return updatedVehicle;
};

// ============================================================================
// Delete Vehicle
// ============================================================================

export const deleteVehicle = async (args: DeleteVehicleInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN can delete vehicles');
  }

  // Get existing vehicle
  const existingVehicle = await context.entities.Vehicle.findUnique({
    where: { id: args.id },
    include: {
      dispatches: true,
    },
  });

  if (!existingVehicle) {
    throw new HttpError(404, 'Vehicle not found');
  }

  // Check if vehicle has dispatches
  if (existingVehicle.dispatches.length > 0) {
    throw new HttpError(400, 'Cannot delete vehicle with existing dispatches');
  }

  // Delete vehicle
  const deletedVehicle = await context.entities.Vehicle.delete({
    where: { id: args.id },
  });

  return deletedVehicle;
};
