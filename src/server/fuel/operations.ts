import type { GetFuelLogs, UpdateFuelLogStatus } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { Prisma } from '@prisma/client';
import { prisma } from 'wasp/server';

export const getFuelLogs: GetFuelLogs<{ status?: string; page?: number }, any> = async (
  { status, page = 1 },
  context
) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  const limit = 20;
  const offset = (page - 1) * limit;

  let logs: any[];
  let countResult: any[];

  if (status && status !== 'all') {
    logs = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, "zaloMsgId", "zaloGroupName", "fuelDate", "entryDate",
               "licensePlate", "vehicleId", "driverName", "driverId",
               "liters", "unitPrice", "totalAmount",
               "imageUrls", "hasInvoice", confidence, "rawText", "aiNotes", status, "createdAt"
        FROM fuel_logs
        WHERE status = ${status}
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM fuel_logs WHERE status = ${status}`
    );
  } else {
    logs = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, "zaloMsgId", "zaloGroupName", "fuelDate", "entryDate",
               "licensePlate", "vehicleId", "driverName", "driverId",
               "liters", "unitPrice", "totalAmount",
               "imageUrls", "hasInvoice", confidence, "rawText", "aiNotes", status, "createdAt"
        FROM fuel_logs
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM fuel_logs`
    );
  }

  return { logs: logs || [], total: countResult?.[0]?.count || 0, page, limit };
};

export const updateFuelLogStatus: UpdateFuelLogStatus<
  { id: string; status: 'confirmed' | 'rejected'; vehicleId?: string | null; driverId?: string | null },
  { success: boolean }
> = async ({ id, status, vehicleId, driverId }, context) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  if (vehicleId !== undefined || driverId !== undefined) {
    // Update vehicle/driver bindings along with status
    const vehicle = vehicleId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`SELECT id, "licensePlate" FROM vehicles WHERE id = ${vehicleId} LIMIT 1`)
      : null;
    const licensePlate = vehicle?.[0]?.licensePlate;

    const driver = driverId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`SELECT id, "fullName" FROM drivers WHERE id = ${driverId} LIMIT 1`)
      : null;
    const driverName = driver?.[0]?.fullName;

    await prisma.$executeRaw(Prisma.sql`
      UPDATE fuel_logs SET
        status = ${status},
        "vehicleId" = ${vehicleId ?? null},
        "driverId" = ${driverId ?? null},
        "licensePlate" = CASE WHEN ${licensePlate} IS NOT NULL THEN ${licensePlate} ELSE "licensePlate" END,
        "driverName" = CASE WHEN ${driverName} IS NOT NULL THEN ${driverName} ELSE "driverName" END,
        "updatedAt" = NOW()
      WHERE id = ${id}
    `);
  } else {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE fuel_logs SET status = ${status}, "updatedAt" = NOW() WHERE id = ${id}`
    );
  }

  return { success: true };
};

export const updateFuelLog: any = async (args: {
  id: string;
  vehicleId?: string | null;
  driverId?: string | null;
  licensePlate?: string;
  driverName?: string | null;
  fuelDate?: string | null;
  liters?: number;
  unitPrice?: number;
  totalAmount?: number;
  aiNotes?: string | null;
}, context: any) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  const { id, vehicleId, driverId, licensePlate, driverName, fuelDate, liters, unitPrice, totalAmount, aiNotes } = args;

  // If vehicleId provided, resolve licensePlate from DB
  let resolvedLicensePlate = licensePlate;
  let resolvedDriverName = driverName;

  if (vehicleId) {
    const v = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "licensePlate" FROM vehicles WHERE id = ${vehicleId} LIMIT 1`);
    if (v?.[0]?.licensePlate) resolvedLicensePlate = v[0].licensePlate;
  }
  if (driverId) {
    const d = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "fullName" FROM drivers WHERE id = ${driverId} LIMIT 1`);
    if (d?.[0]?.fullName) resolvedDriverName = d[0].fullName;
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE fuel_logs SET
      "vehicleId" = COALESCE(${vehicleId ?? null}, "vehicleId"),
      "driverId" = COALESCE(${driverId ?? null}, "driverId"),
      "licensePlate" = COALESCE(${resolvedLicensePlate ?? null}, "licensePlate"),
      "driverName" = ${resolvedDriverName ?? null},
      "fuelDate" = ${fuelDate ? Prisma.sql`${fuelDate}::date` : Prisma.sql`"fuelDate"`},
      liters = COALESCE(${liters ?? null}, liters),
      "unitPrice" = COALESCE(${unitPrice ?? null}, "unitPrice"),
      "totalAmount" = COALESCE(${totalAmount ?? null}, "totalAmount"),
      "aiNotes" = ${aiNotes ?? null},
      "updatedAt" = NOW()
    WHERE id = ${id}
  `);

  return { success: true };
};

export const deleteFuelLog: any = async (args: { id: string }, context: any) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');
  await prisma.$executeRaw(Prisma.sql`DELETE FROM fuel_logs WHERE id = ${args.id}`);
  return { success: true };
};
