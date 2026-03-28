import type { GetRepairLogs, UpdateRepairLogStatus } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { Prisma } from '@prisma/client';
import { prisma } from 'wasp/server';

export const getRepairLogs: GetRepairLogs<{ status?: string; page?: number }, any> = async (
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
        SELECT id, "zaloMsgId", "zaloGroupName", "repairDate", "entryDate",
               "licensePlate", "driverName", "garageName", "garageAddress",
               items, "totalAmount", km, "imageUrls", confidence, "rawText", "aiNotes",
               status, "createdAt"
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
               "licensePlate", "driverName", "garageName", "garageAddress",
               items, "totalAmount", km, "imageUrls", confidence, "rawText", "aiNotes",
               status, "createdAt"
        FROM repair_logs
        ORDER BY "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );
    countResult = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM repair_logs`
    );
  }

  return {
    logs: logs || [],
    total: countResult?.[0]?.count || 0,
    page,
    limit,
  };
};

export const updateRepairLogStatus: UpdateRepairLogStatus<
  { id: string; status: 'confirmed' | 'rejected' },
  { success: boolean }
> = async ({ id, status }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  await prisma.$executeRaw(
    Prisma.sql`UPDATE repair_logs SET status = ${status}, "updatedAt" = NOW() WHERE id = ${id}`
  );

  return { success: true };
};

export const updateRepairLog: any = async (args: {
  id: string;
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
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { id, licensePlate, driverName, repairDate, garageName, garageAddress, km, items, totalAmount, aiNotes } = args;

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE repair_logs
      SET "licensePlate" = COALESCE(${licensePlate}, "licensePlate"),
          "driverName" = ${driverName},
          "repairDate" = ${repairDate ? Prisma.sql`${repairDate}::date` : Prisma.sql`"repairDate"`},
          "garageName" = ${garageName},
          "garageAddress" = ${garageAddress},
          km = ${km},
          items = ${items ? Prisma.sql`${JSON.stringify(items)}::jsonb` : Prisma.sql`items`},
          "totalAmount" = COALESCE(${totalAmount}, "totalAmount"),
          "aiNotes" = ${aiNotes},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `
  );

  return { success: true };
};

export const deleteRepairLog: any = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM repair_logs WHERE id = ${args.id}`
  );

  return { success: true };
};
