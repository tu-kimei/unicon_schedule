import type { Vehicle } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Get All Vehicles
// ============================================================================

export const getAllVehicles = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  // Fetch all vehicles
  const vehicles = await context.entities.Vehicle.findMany({});

  // Custom sorting logic:
  // 1. Sort by status: IN_USE -> MAINTENANCE -> OUT_OF_SERVICE
  // 2. Within each status group, sort by inspectionExpiryDate (nearest to farthest)
  const statusOrder = {
    'IN_USE': 1,
    'MAINTENANCE': 2,
    'OUT_OF_SERVICE': 3,
  };

  const sortedVehicles = vehicles.sort((a: any, b: any) => {
    // First, sort by status
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    // Then, sort by inspectionExpiryDate (ascending - nearest first)
    const dateA = new Date(a.inspectionExpiryDate).getTime();
    const dateB = new Date(b.inspectionExpiryDate).getTime();
    return dateA - dateB;
  });

  return sortedVehicles;
};

// ============================================================================
// Get Vehicle by ID
// ============================================================================

type GetVehicleInput = {
  id: string;
};

export const getVehicle = async (args: GetVehicleInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const vehicle = await context.entities.Vehicle.findUnique({
    where: { id: args.id },
  });

  if (!vehicle) {
    throw new HttpError(404, 'Vehicle not found');
  }

  return vehicle;
};
