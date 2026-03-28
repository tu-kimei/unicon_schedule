import type { GetDashboardStats } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { Prisma } from '@prisma/client';
import { prisma } from 'wasp/server';

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Stats Query
// ────────────────────────────────────────────────────────────────────────────

export const getDashboardStats: GetDashboardStats<
  {
    dateFrom?: string;
    dateTo?: string;
    vehicleId?: string;
    driverId?: string;
    includeUnconfirmed?: boolean;
  },
  any
> = async (filters, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Check role: Admin + Accounting
  if (context.user.role !== 'ADMIN' && context.user.role !== 'ACCOUNTING') {
    throw new HttpError(403, 'Forbidden: Dashboard access limited to Admin and Accounting');
  }

  const { dateFrom, dateTo, vehicleId, driverId, includeUnconfirmed = false } = filters;

  // Build date filter
  let dateFilter = '';
  const params: any[] = [];
  let paramIndex = 1;

  if (dateFrom) {
    dateFilter += ` AND "fuelDate" >= $${paramIndex}::date`;
    params.push(dateFrom);
    paramIndex++;
  }
  if (dateTo) {
    dateFilter += ` AND "fuelDate" <= $${paramIndex}::date`;
    params.push(dateTo);
    paramIndex++;
  }

  // Status filter
  const statusFilter = includeUnconfirmed
    ? `status IN ('confirmed', 'pending')`
    : `status = 'confirmed'`;

  // ──── KPI Metrics ────────────────────────────────────────────────────────

  // Total Fuel Cost
  const fuelTotalResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total,
      COALESCE(SUM(liters), 0)::numeric as liters,
      COALESCE(AVG("unitPrice"), 0)::numeric as avg_price
    FROM fuel_logs
    WHERE ${statusFilter} ${dateFilter}`,
    ...params
  );

  const fuelStats = fuelTotalResult[0] || { count: 0, total: 0, liters: 0, avg_price: 0 };

  // Total Repair Cost
  const repairTotalResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total
    FROM repair_logs
    WHERE ${statusFilter.replace('fuelDate', 'repairDate')} ${dateFilter.replace('fuelDate', 'repairDate')}`,
    ...params
  );

  const repairStats = repairTotalResult[0] || { count: 0, total: 0 };

  // ──── Top Vehicles by Fuel Cost ──────────────────────────────────────────

  const topVehiclesFuel = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      "licensePlate",
      COUNT(*)::int as count,
      SUM("totalAmount")::numeric as total
    FROM fuel_logs
    WHERE ${statusFilter} ${dateFilter}
    GROUP BY "licensePlate"
    ORDER BY total DESC
    LIMIT 10`,
    ...params
  );

  // ──── Top Vehicles by Repair Cost ────────────────────────────────────────

  const topVehiclesRepair = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      "licensePlate",
      COUNT(*)::int as count,
      SUM("totalAmount")::numeric as total
    FROM repair_logs
    WHERE ${statusFilter.replace('fuelDate', 'repairDate')} ${dateFilter.replace('fuelDate', 'repairDate')}
    GROUP BY "licensePlate"
    ORDER BY total DESC
    LIMIT 10`,
    ...params
  );

  // ──── Fuel Trend by Month ─────────────────────────────────────────────────

  const fuelTrend = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      TO_CHAR("fuelDate", 'YYYY-MM') as month,
      COUNT(*)::int as count,
      SUM("totalAmount")::numeric as total,
      SUM(liters)::numeric as liters
    FROM fuel_logs
    WHERE ${statusFilter} ${dateFilter}
    GROUP BY month
    ORDER BY month ASC`,
    ...params
  );

  // ──── Repair Trend by Month ───────────────────────────────────────────────

  const repairTrend = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      TO_CHAR("repairDate", 'YYYY-MM') as month,
      COUNT(*)::int as count,
      SUM("totalAmount")::numeric as total
    FROM repair_logs
    WHERE ${statusFilter.replace('fuelDate', 'repairDate')} ${dateFilter.replace('fuelDate', 'repairDate')}
    GROUP BY month
    ORDER BY month ASC`,
    ...params
  );

  // ──── Return Aggregated Results ───────────────────────────────────────────

  return {
    kpi: {
      fuelTotal: Number(fuelStats.total),
      fuelLiters: Number(fuelStats.liters),
      fuelCount: fuelStats.count,
      fuelAvgPrice: Number(fuelStats.avg_price),
      repairTotal: Number(repairStats.total),
      repairCount: repairStats.count,
      totalSpending: Number(fuelStats.total) + Number(repairStats.total),
    },
    topVehiclesFuel: topVehiclesFuel.map((v: any) => ({
      licensePlate: v.licensePlate,
      count: v.count,
      total: Number(v.total),
    })),
    topVehiclesRepair: topVehiclesRepair.map((v: any) => ({
      licensePlate: v.licensePlate,
      count: v.count,
      total: Number(v.total),
    })),
    fuelTrend: fuelTrend.map((t: any) => ({
      month: t.month,
      count: t.count,
      total: Number(t.total),
      liters: Number(t.liters),
    })),
    repairTrend: repairTrend.map((t: any) => ({
      month: t.month,
      count: t.count,
      total: Number(t.total),
    })),
  };
};
