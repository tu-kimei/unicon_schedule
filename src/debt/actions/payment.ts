import type { Debt } from 'wasp/entities';
import type { MarkDebtAsPaid } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

type MarkDebtAsPaidInput = {
  id: string;
  paidAmount: number;
  paidDate: Date;
  paymentProofImages?: string[];
  paymentNotes?: string;
};

export const markDebtAsPaid: MarkDebtAsPaid<MarkDebtAsPaidInput, Debt> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can mark debts as paid');
  }

  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!existingDebt) throw new HttpError(404, 'Debt not found');
  if (existingDebt.deletedAt) throw new HttpError(400, 'Cannot update deleted debt');
  if (existingDebt.status === 'PAID') throw new HttpError(400, 'Debt is already paid');
  if (existingDebt.status === 'CANCELLED') throw new HttpError(400, 'Cannot mark cancelled debt as paid');
  if (args.paidAmount <= 0) throw new HttpError(400, 'Paid amount must be greater than 0');

  const debtAmount = Number(existingDebt.amount);
  const previouslyPaid = Number(existingDebt.paidAmount || 0);
  const totalPaid = previouslyPaid + args.paidAmount;

  if (totalPaid > debtAmount + 0.01) {
    throw new HttpError(
      400,
      `Tổng thanh toán (${totalPaid}) vượt quá số tiền công nợ (${debtAmount} VND). Đã thanh toán trước đó: ${previouslyPaid} VND.`
    );
  }

  if (!args.paidDate || isNaN(new Date(args.paidDate).getTime())) {
    throw new HttpError(400, 'Invalid paid date');
  }

  const isFullyPaid = Math.abs(totalPaid - debtAmount) < 0.01;
  const newStatus = isFullyPaid ? 'PAID' : existingDebt.status;

  // Create DebtPayment record
  await context.entities.DebtPayment.create({
    data: {
      debtId: args.id,
      amount: args.paidAmount,
      paidDate: args.paidDate,
      proofImages: args.paymentProofImages || [],
      notes: args.paymentNotes || null,
      createdById: user.id,
    },
  });

  // Update debt summary fields
  const paidDebt = await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      status: newStatus,
      paidAmount: totalPaid,
      paidDate: args.paidDate,
    },
    include: {
      customer: true,
      createdBy: {
        select: { id: true, fullName: true, email: true },
      },
      payments: {
        orderBy: { createdAt: 'asc' },
        include: {
          createdBy: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return paidDebt;
};
