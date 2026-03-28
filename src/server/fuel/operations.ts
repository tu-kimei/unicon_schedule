import type { GetFuelLogs, UpdateFuelLogStatus } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { Prisma } from '@prisma/client';

// Use Wasp's built-in dbClient instead of creating our own PrismaClient
// This ensures we use the same connection pool and DATABASE_URL
import { prisma } from 'wasp/server';

export const getFuelLogs: GetFuelLogs<{ status?: string; page?: number }, any> = async (
  { status, page = 1 },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const limit = 20;
  const offset = (page - 1) * limit;

  let logs: any[];
  let countResult: any[];

  if (status && status !== 'all') {
    logs = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, "zaloMsgId", "zaloGroupName", "fuelDate", "entryDate",
               "licensePlate", "driverName", "liters", "unitPrice", "totalAmount",
               "imageUrls", "hasInvoice", confidence, "rawText", "aiNotes", status,
               "createdAt"
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
               "licensePlate", "driverName", "liters", "unitPrice", "totalAmount",
               "imageUrls", "hasInvoice", confidence, "rawText", "aiNotes", status,
               "createdAt"
        FROM fuel_logs
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM fuel_logs`
    );
  }

  return {
    logs: logs || [],
    total: countResult?.[0]?.count || 0,
    page,
    limit,
  };
};

export const updateFuelLogStatus: UpdateFuelLogStatus<
  { id: string; status: 'confirmed' | 'rejected' },
  { success: boolean }
> = async ({ id, status }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  console.log('[updateFuelLogStatus] id:', id, 'status:', status);

  const result = await prisma.$executeRaw(
    Prisma.sql`UPDATE fuel_logs SET status = ${status}, "updatedAt" = NOW() WHERE id = ${id}`
  );

  console.log('[updateFuelLogStatus] affected rows:', result);

  return { success: true };
};

export const updateFuelLog: any = async (args: {
  id: string;
  licensePlate?: string;
  driverName?: string | null;
  fuelDate?: string | null;
  liters?: number;
  unitPrice?: number;
  totalAmount?: number;
  aiNotes?: string | null;
}, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { id, licensePlate, driverName, fuelDate, liters, unitPrice, totalAmount, aiNotes } = args;

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE fuel_logs
      SET "licensePlate" = COALESCE(${licensePlate}, "licensePlate"),
          "driverName" = ${driverName},
          "fuelDate" = ${fuelDate ? Prisma.sql`${fuelDate}::date` : Prisma.sql`"fuelDate"`},
          liters = COALESCE(${liters}, liters),
          "unitPrice" = COALESCE(${unitPrice}, "unitPrice"),
          "totalAmount" = COALESCE(${totalAmount}, "totalAmount"),
          "aiNotes" = ${aiNotes},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `
  );

  return { success: true };
};

export const deleteFuelLog: any = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM fuel_logs WHERE id = ${args.id}`
  );

  return { success: true };
};
