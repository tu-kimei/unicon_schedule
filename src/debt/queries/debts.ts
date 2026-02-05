import type { Debt } from 'wasp/entities';
import type { GetAllDebts, GetDebt } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { isDebtOverdue, getDaysOverdue, getDaysUntilDue } from '../utils/debtCalculations';

// ============================================================================
// Types
// ============================================================================

type DebtStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';

type GetAllDebtsInput = {
  customerId?: string;
  debtMonth?: string;
  status?: DebtStatus;
  debtType?: DebtType;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type GetDebtInput = {
  id: string;
};

// ============================================================================
// Get All Debts
// ============================================================================

export const getAllDebts: GetAllDebts<GetAllDebtsInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view debts');
  }

  const {
    customerId,
    debtMonth,
    status,
    debtType,
    isOverdue,
    page = 1,
    limit = 20,
    sortBy = 'dueDate',
    sortOrder = 'desc',
  } = args;

  // Build where clause
  const where: any = {
    deletedAt: null, // Exclude soft-deleted
  };

  if (customerId) {
    where.customerId = customerId;
  }

  if (debtMonth) {
    where.debtMonth = debtMonth;
  }

  if (debtType) {
    where.debtType = debtType;
  }

  if (status) {
    where.status = status;
  }

  // Get total count
  const total = await context.entities.Debt.count({ where });

  // Get debts with pagination
  const debts = await context.entities.Debt.findMany({
    where,
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Add computed fields and filter by overdue if needed
  let enrichedDebts = debts.map((debt) => {
    const isOverdueFlag = isDebtOverdue(debt);
    const daysOverdueValue = isOverdueFlag ? getDaysOverdue(debt.dueDate) : null;
    const daysUntilDueValue = !isOverdueFlag ? getDaysUntilDue(debt.dueDate) : null;

    return {
      ...debt,
      isOverdue: isOverdueFlag,
      daysOverdue: daysOverdueValue,
      daysUntilDue: daysUntilDueValue,
    };
  });

  // Filter by overdue if requested
  if (isOverdue === true) {
    enrichedDebts = enrichedDebts.filter((d) => d.isOverdue);
  }

  // Calculate summary
  const summary = {
    totalAmount: debts.reduce((sum, d) => sum + Number(d.amount), 0),
    totalUnpaid: debts
      .filter((d) => d.status === 'UNPAID' || d.status === 'OVERDUE')
      .reduce((sum, d) => sum + Number(d.amount), 0),
    totalPaid: debts
      .filter((d) => d.status === 'PAID')
      .reduce((sum, d) => sum + Number(d.paidAmount || 0), 0),
    totalOverdue: enrichedDebts
      .filter((d) => d.isOverdue)
      .reduce((sum, d) => sum + Number(d.amount), 0),
    countUnpaid: debts.filter((d) => d.status === 'UNPAID').length,
    countPaid: debts.filter((d) => d.status === 'PAID').length,
    countOverdue: enrichedDebts.filter((d) => d.isOverdue).length,
  };

  return {
    debts: enrichedDebts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    summary,
  };
};

// ============================================================================
// Get Debt by ID
// ============================================================================

export const getDebt: GetDebt<GetDebtInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view debts');
  }

  const debt = await context.entities.Debt.findUnique({
    where: { id: args.id },
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!debt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (debt.deletedAt) {
    throw new HttpError(404, 'Debt has been deleted');
  }

  // Add computed fields
  const isOverdueFlag = isDebtOverdue(debt);
  const daysOverdueValue = isOverdueFlag ? getDaysOverdue(debt.dueDate) : null;
  const daysUntilDueValue = !isOverdueFlag ? getDaysUntilDue(debt.dueDate) : null;

  return {
    ...debt,
    isOverdue: isOverdueFlag,
    daysOverdue: daysOverdueValue,
    daysUntilDue: daysUntilDueValue,
  };
};
