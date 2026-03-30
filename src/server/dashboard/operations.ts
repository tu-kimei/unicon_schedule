import type { GetDashboardStats } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';

function buildWhereClause(
  dateColumn: 'fuelDate' | 'repairDate',
  filters: {
    dateFrom?: string;
    dateTo?: string;
    vehicleId?: string;
    driverId?: string;
    includeUnconfirmed?: boolean;
  },
  extraFields?: { vehicleColumn?: string; driverColumn?: string }
) {
  const params: any[] = [];
  const conditions: string[] = [];
  let idx = 1;

  if (filters.includeUnconfirmed) {
    conditions.push(`status IN ('confirmed', 'pending')`);
  } else {
    conditions.push(`status = 'confirmed'`);
  }

  if (filters.dateFrom) {
    conditions.push(`"${dateColumn}" >= $${idx}::date`);
    params.push(filters.dateFrom);
    idx++;
  }

  if (filters.dateTo) {
    conditions.push(`"${dateColumn}" <= $${idx}::date`);
    params.push(filters.dateTo);
    idx++;
  }

  if (filters.vehicleId && extraFields?.vehicleColumn) {
    conditions.push(`"${extraFields.vehicleColumn}" = $${idx}`);
    params.push(filters.vehicleId);
    idx++;
  }

  if (filters.driverId && extraFields?.driverColumn) {
    conditions.push(`"${extraFields.driverColumn}" = $${idx}`);
    params.push(filters.driverId);
    idx++;
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

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

  if (context.user.role !== 'ADMIN' && context.user.role !== 'ACCOUNTING') {
    throw new HttpError(403, 'Forbidden: Dashboard access limited to Admin and Accounting');
  }

  const fuelWhere = buildWhereClause('fuelDate', filters, { vehicleColumn: 'vehicleId', driverColumn: 'driverId' });
  const repairWhere = buildWhereClause('repairDate', filters, { vehicleColumn: 'vehicleId', driverColumn: 'driverId' });

  const fuelTotalResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total,
      COALESCE(SUM(liters), 0)::numeric as liters,
      COALESCE(AVG("unitPrice"), 0)::numeric as avg_price
    FROM fuel_logs
    ${fuelWhere.where}`,
    ...fuelWhere.params
  );

  const repairTotalResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total
    FROM repair_logs
    ${repairWhere.where}`,
    ...repairWhere.params
  );

  const topVehiclesFuel = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      "licensePlate",
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total
    FROM fuel_logs
    ${fuelWhere.where}
    GROUP BY "licensePlate"
    ORDER BY total DESC
    LIMIT 10`,
    ...fuelWhere.params
  );

  const topVehiclesRepair = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      "licensePlate",
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total
    FROM repair_logs
    ${repairWhere.where}
    GROUP BY "licensePlate"
    ORDER BY total DESC
    LIMIT 10`,
    ...repairWhere.params
  );

  const fuelTrend = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      TO_CHAR("fuelDate", 'YYYY-MM') as month,
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total,
      COALESCE(SUM(liters), 0)::numeric as liters
    FROM fuel_logs
    ${fuelWhere.where}
    GROUP BY month
    ORDER BY month ASC`,
    ...fuelWhere.params
  );

  const repairTrend = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      TO_CHAR("repairDate", 'YYYY-MM') as month,
      COUNT(*)::int as count,
      COALESCE(SUM("totalAmount"), 0)::numeric as total
    FROM repair_logs
    ${repairWhere.where}
    GROUP BY month
    ORDER BY month ASC`,
    ...repairWhere.params
  );

  const fuelStats = fuelTotalResult[0] || { count: 0, total: 0, liters: 0, avg_price: 0 };
  const repairStats = repairTotalResult[0] || { count: 0, total: 0 };

  return {
    kpi: {
      fuelTotal: Number(fuelStats.total),
      fuelLiters: Number(fuelStats.liters),
      fuelCount: Number(fuelStats.count),
      fuelAvgPrice: Number(fuelStats.avg_price),
      repairTotal: Number(repairStats.total),
      repairCount: Number(repairStats.count),
      totalSpending: Number(fuelStats.total) + Number(repairStats.total),
    },
    topVehiclesFuel: topVehiclesFuel.map((v: any) => ({
      licensePlate: v.licensePlate,
      count: Number(v.count),
      total: Number(v.total),
    })),
    topVehiclesRepair: topVehiclesRepair.map((v: any) => ({
      licensePlate: v.licensePlate,
      count: Number(v.count),
      total: Number(v.total),
    })),
    fuelTrend: fuelTrend.map((t: any) => ({
      month: t.month,
      count: Number(t.count),
      total: Number(t.total),
      liters: Number(t.liters),
    })),
    repairTrend: repairTrend.map((t: any) => ({
      month: t.month,
      count: Number(t.count),
      total: Number(t.total),
    })),
  };
};
