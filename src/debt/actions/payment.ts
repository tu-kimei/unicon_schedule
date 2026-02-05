import type { Debt } from 'wasp/entities';
import type { MarkDebtAsPaid } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type MarkDebtAsPaidInput = {
  id: string;
  paidAmount: number;
  paidDate: Date;
  paymentProofImages?: string[];
  paymentNotes?: string;
};

// ============================================================================
// Mark Debt as Paid
// ============================================================================

export const markDebtAsPaid: MarkDebtAsPaid<MarkDebtAsPaidInput, Debt> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can mark debts as paid');
  }

  // Get existing debt
  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!existingDebt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (existingDebt.deletedAt) {
    throw new HttpError(400, 'Cannot update deleted debt');
  }

  // Cannot mark as paid if already paid
  if (existingDebt.status === 'PAID') {
    throw new HttpError(400, 'Debt is already paid');
  }

  // Cannot mark as paid if cancelled
  if (existingDebt.status === 'CANCELLED') {
    throw new HttpError(400, 'Cannot mark cancelled debt as paid');
  }

  // Validate paid amount
  if (args.paidAmount <= 0) {
    throw new HttpError(400, 'Paid amount must be greater than 0');
  }

  // MVP: Paid amount must equal debt amount (full payment only)
  const debtAmount = Number(existingDebt.amount);
  if (Math.abs(args.paidAmount - debtAmount) > 0.01) {
    throw new HttpError(
      400,
      `Paid amount must equal debt amount (${debtAmount} VND). Partial payment not supported in MVP.`
    );
  }

  // Validate paid date
  if (!args.paidDate || isNaN(new Date(args.paidDate).getTime())) {
    throw new HttpError(400, 'Invalid paid date');
  }

  // Update debt
  const paidDebt = await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      status: 'PAID',
      paidAmount: args.paidAmount,
      paidDate: args.paidDate,
      paymentProofImages: args.paymentProofImages || [],
      paymentNotes: args.paymentNotes || null,
    },
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
  });

  return paidDebt;
};
