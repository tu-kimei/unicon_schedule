import type { GetRepairLogs, UpdateRepairLogStatus } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { Prisma } from '@prisma/client';
import { prisma } from 'wasp/server';

export const getRepairLogs: GetRepairLogs<{ status?: string; page?: number }, any> = async (
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
        SELECT id, "zaloMsgId", "zaloGroupName", "repairDate", "entryDate",
               "licensePlate", "vehicleId", "driverName", "driverId",
               "garageName", "garageAddress", items, "totalAmount", km,
               "imageUrls", confidence, "rawText", "aiNotes", status, "createdAt"
        FROM repair_logs
        WHERE status = ${status}
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM repair_logs WHERE status = ${status}`
    );
  } else {
    logs = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, "zaloMsgId", "zaloGroupName", "repairDate", "entryDate",
               "licensePlate", "vehicleId", "driverName", "driverId",
               "garageName", "garageAddress", items, "totalAmount", km,
               "imageUrls", confidence, "rawText", "aiNotes", status, "createdAt"
        FROM repair_logs
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM repair_logs`
    );
  }

  return { logs: logs || [], total: countResult?.[0]?.count || 0, page, limit };
};

export const updateRepairLogStatus: UpdateRepairLogStatus<
  { id: string; status: 'confirmed' | 'rejected'; vehicleId?: string | null; driverId?: string | null },
  { success: boolean }
> = async ({ id, status, vehicleId, driverId }, context) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  if (vehicleId !== undefined || driverId !== undefined) {
    const vehicle = vehicleId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`SELECT id, "licensePlate" FROM vehicles WHERE id = ${vehicleId} LIMIT 1`)
      : null;
    const licensePlate = vehicle?.[0]?.licensePlate;

    const driver = driverId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`SELECT id, "fullName" FROM drivers WHERE id = ${driverId} LIMIT 1`)
      : null;
    const driverName = driver?.[0]?.fullName;

    await prisma.$executeRaw(Prisma.sql`
      UPDATE repair_logs SET
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
      Prisma.sql`UPDATE repair_logs SET status = ${status}, "updatedAt" = NOW() WHERE id = ${id}`
    );
  }

  return { success: true };
};

export const updateRepairLog: any = async (args: {
  id: string;
  vehicleId?: string | null;
  driverId?: string | null;
  licensePlate?: string;
  driverName?: string | null;
  repairDate?: string | null;
  garageName?: string | null;
  garageAddress?: string | null;
  km?: number | null;
  items?: any;
  totalAmount?: number;
  aiNotes?: string | null;
}, context: any) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  const { id, vehicleId, driverId, licensePlate, driverName, repairDate, garageName, garageAddress, km, items, totalAmount, aiNotes } = args;

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
    UPDATE repair_logs SET
      "vehicleId" = COALESCE(${vehicleId ?? null}, "vehicleId"),
      "driverId" = COALESCE(${driverId ?? null}, "driverId"),
      "licensePlate" = COALESCE(${resolvedLicensePlate ?? null}, "licensePlate"),
      "driverName" = ${resolvedDriverName ?? null},
      "repairDate" = ${repairDate ? Prisma.sql`${repairDate}::date` : Prisma.sql`"repairDate"`},
      "garageName" = ${garageName ?? null},
      "garageAddress" = ${garageAddress ?? null},
      km = ${km ?? null},
      items = ${items ? Prisma.sql`${JSON.stringify(items)}::jsonb` : Prisma.sql`items`},
      "totalAmount" = COALESCE(${totalAmount ?? null}, "totalAmount"),
      "aiNotes" = ${aiNotes ?? null},
      "updatedAt" = NOW()
    WHERE id = ${id}
  `);

  return { success: true };
};

export const deleteRepairLog: any = async (args: { id: string }, context: any) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');
  await prisma.$executeRaw(Prisma.sql`DELETE FROM repair_logs WHERE id = ${args.id}`);
  return { success: true };
};
