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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN và ACCOUNTING mới có thể đánh dấu công nợ đã thanh toán');
  }

  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!existingDebt) throw new HttpError(404, 'Không tìm thấy công nợ');
  if (existingDebt.deletedAt) throw new HttpError(400, 'Không thể cập nhật công nợ đã xóa');
  if (existingDebt.status === 'PAID') throw new HttpError(400, 'Công nợ đã được thanh toán');
  if (existingDebt.status === 'CANCELLED') throw new HttpError(400, 'Không thể đánh dấu công nợ đã hủy là đã thanh toán');
  if (args.paidAmount <= 0) throw new HttpError(400, 'Số tiền thanh toán phải lớn hơn 0');

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
    throw new HttpError(400, 'Ngày thanh toán không hợp lệ');
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
