import type { Driver } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Get All Drivers
// ============================================================================

export const getAllDrivers = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const drivers = await context.entities.Driver.findMany({
    include: {
      user: true,
      dispatches: {
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return drivers.map((driver: any) => ({
    ...driver,
    dispatchCount: driver.dispatches.length,
    dispatches: undefined,
  }));
};

// ============================================================================
// Get Driver by ID
// ============================================================================

type GetDriverInput = {
  id: string;
};

export const getDriver = async (args: GetDriverInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const driver = await context.entities.Driver.findUnique({
    where: { id: args.id },
    include: {
      user: true,
    },
  });

  if (!driver) {
    throw new HttpError(404, 'Không tìm thấy tài xế');
  }

  return driver;
};
