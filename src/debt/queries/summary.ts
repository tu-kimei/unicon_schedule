import type { GetDebtsSummaryByCustomer, GetDebtsSummaryByMonth } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { isDebtOverdue, getDaysOverdue } from '../utils/debtCalculations';

// ============================================================================
// Types
// ============================================================================

type GetDebtsSummaryByCustomerInput = {
  customerId?: string;
};

type GetDebtsSummaryByMonthInput = {
  year?: number;
};

// ============================================================================
// Get Debts Summary by Customer
// ============================================================================

export const getDebtsSummaryByCustomer: GetDebtsSummaryByCustomer<
  GetDebtsSummaryByCustomerInput,
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view debt summaries');
  }

  const { customerId } = args;

  if (!customerId) {
    throw new HttpError(400, 'Customer ID is required');
  }

  // Get all debts for this customer
  const debts = await context.entities.Debt.findMany({
    where: {
      customerId,
      deletedAt: null,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      debtMonth: 'desc',
    },
  });

  // Calculate total summary (all time)
  let totalAmount = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;
  let totalOverdue = 0;
  let countTotal = debts.length;
  let countPaid = 0;
  let countUnpaid = 0;
  let countOverdue = 0;

  // Group by month for monthly breakdown
  const monthlyMap = new Map<string, any>();

  debts.forEach((debt) => {
    const amount = Number(debt.amount);
    const paidAmount = Number(debt.paidAmount || 0);
    const isOverdue = isDebtOverdue(debt);
    const month = debt.debtMonth;

    // Total summary
    totalAmount += amount;

    if (debt.status === 'PAID') {
      totalPaid += paidAmount;
      countPaid += 1;
    } else if (debt.status === 'UNPAID' || debt.status === 'OVERDUE') {
      totalUnpaid += amount;
      countUnpaid += 1;

      if (isOverdue) {
        totalOverdue += amount;
        countOverdue += 1;
      }
    }

    // Monthly breakdown
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        totalAmount: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalOverdue: 0,
        countTotal: 0,
        countPaid: 0,
        countUnpaid: 0,
        countOverdue: 0,
        isOverdue: false,
        debts: [],
      });
    }

    const monthlySummary = monthlyMap.get(month);
    monthlySummary.totalAmount += amount;
    monthlySummary.countTotal += 1;

    if (debt.status === 'PAID') {
      monthlySummary.totalPaid += paidAmount;
      monthlySummary.countPaid += 1;
    } else {
      monthlySummary.totalUnpaid += amount;
      monthlySummary.countUnpaid += 1;

      if (isOverdue) {
        monthlySummary.totalOverdue += amount;
        monthlySummary.countOverdue += 1;
        monthlySummary.isOverdue = true;
      }
    }

    monthlySummary.debts.push(debt);
  });

  // Sort months descending
  const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  return {
    // Total summary (all time)
    totalAmount,
    totalPaid,
    totalUnpaid,
    totalOverdue,
    countTotal,
    countPaid,
    countUnpaid,
    countOverdue,
    
    // Monthly breakdown
    monthlyBreakdown,
    
    // All debts list
    debts,
  };
};

// ============================================================================
// Get Debts Summary by Month
// ============================================================================

export const getDebtsSummaryByMonth: GetDebtsSummaryByMonth<
  GetDebtsSummaryByMonthInput,
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view debt summaries');
  }

  const { year = new Date().getFullYear() } = args;

  // Get all debts for the year
  const debts = await context.entities.Debt.findMany({
    where: {
      deletedAt: null,
      debtMonth: {
        startsWith: String(year),
      },
    },
  });

  // Group by month
  const monthMap = new Map<string, any>();

  debts.forEach((debt) => {
    const month = debt.debtMonth;

    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        totalDebts: 0,
        totalUnpaid: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countUnpaid: 0,
        countPaid: 0,
        countOverdue: 0,
      });
    }

    const summary = monthMap.get(month);
    const amount = Number(debt.amount);
    const isOverdue = isDebtOverdue(debt);

    summary.totalDebts += amount;

    if (debt.status === 'PAID') {
      summary.totalPaid += Number(debt.paidAmount || 0);
      summary.countPaid += 1;
    } else if (debt.status === 'UNPAID' || debt.status === 'OVERDUE') {
      summary.totalUnpaid += amount;
      summary.countUnpaid += 1;

      if (isOverdue) {
        summary.totalOverdue += amount;
        summary.countOverdue += 1;
      }
    }
  });

  // Sort by month descending
  const months = Array.from(monthMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  return { months };
};
