import type { Vehicle } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Get All Vehicles
// ============================================================================

export const getAllVehicles = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const vehicles = await context.entities.Vehicle.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return vehicles;
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
