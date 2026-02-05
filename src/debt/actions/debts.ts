import type { Debt } from 'wasp/entities';
import type {
  CreateDebt,
  UpdateDebt,
  CancelDebt,
  DeleteDebt,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { calculateDueDate } from '../utils/debtCalculations';

// ============================================================================
// Types
// ============================================================================

type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';
type PaymentTermType = 'DAYS' | 'MONTHS';

type CreateDebtInput = {
  customerId: string;
  debtType: DebtType;
  debtMonth: string;
  amount: number;
  documentLink?: string;
  invoiceImages?: string[];
  notes?: string;
  recognitionDate?: Date;
};

type UpdateDebtInput = {
  id: string;
  debtType?: DebtType;
  debtMonth?: string;
  amount?: number;
  documentLink?: string;
  invoiceImages?: string[];
  paymentProofImages?: string[];
  notes?: string;
  recognitionDate?: Date;
};

type CancelDebtInput = {
  id: string;
  reason?: string;
};

type DeleteDebtInput = {
  id: string;
};

// ============================================================================
// Create Debt
// ============================================================================

export const createDebt: CreateDebt<CreateDebtInput, Debt> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can create debts');
  }

  // Validate customer exists
  const customer = await context.entities.Customer.findUnique({
    where: { id: args.customerId },
  });

  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }

  // Validate amount
  if (args.amount <= 0) {
    throw new HttpError(400, 'Amount must be greater than 0');
  }

  // Validate debtMonth format (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(args.debtMonth)) {
    throw new HttpError(400, 'Invalid debtMonth format. Use YYYY-MM (e.g., 2026-02)');
  }

  // Calculate due date
  const recognitionDate = args.recognitionDate || new Date();
  const dueDate = calculateDueDate(
    recognitionDate,
    customer.paymentTermDays,
    customer.paymentTermType
  );

  // Create debt
  const debt = await context.entities.Debt.create({
    data: {
      customerId: args.customerId,
      debtType: args.debtType,
      debtMonth: args.debtMonth,
      amount: args.amount,
      documentLink: args.documentLink || null,
      invoiceImages: args.invoiceImages || [],
      notes: args.notes || null,
      recognitionDate,
      dueDate,
      status: 'UNPAID',
      createdById: user.id,
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

  return debt;
};

// ============================================================================
// Update Debt
// ============================================================================

export const updateDebt: UpdateDebt<UpdateDebtInput, Debt> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can update debts');
  }

  // Get existing debt
  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
    include: { customer: true },
  });

  if (!existingDebt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (existingDebt.deletedAt) {
    throw new HttpError(400, 'Cannot update deleted debt');
  }

  // Allow updating paid debts (removed restriction)

  // Validate amount if provided
  if (args.amount !== undefined && args.amount <= 0) {
    throw new HttpError(400, 'Amount must be greater than 0');
  }

  // Validate debtMonth format if provided
  if (args.debtMonth) {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(args.debtMonth)) {
      throw new HttpError(400, 'Invalid debtMonth format. Use YYYY-MM');
    }
  }

  // Prepare update data
  const updateData: any = {};

  if (args.debtType !== undefined) updateData.debtType = args.debtType;
  if (args.debtMonth !== undefined) updateData.debtMonth = args.debtMonth;
  if (args.amount !== undefined) updateData.amount = args.amount;
  if (args.documentLink !== undefined) updateData.documentLink = args.documentLink;
  if (args.invoiceImages !== undefined) updateData.invoiceImages = args.invoiceImages;
  if (args.paymentProofImages !== undefined) updateData.paymentProofImages = args.paymentProofImages;
  if (args.notes !== undefined) updateData.notes = args.notes;

  // Recalculate due date if recognition date changes
  if (args.recognitionDate !== undefined) {
    updateData.recognitionDate = args.recognitionDate;
    updateData.dueDate = calculateDueDate(
      args.recognitionDate,
      existingDebt.customer.paymentTermDays,
      existingDebt.customer.paymentTermType
    );
  }

  // Update debt
  const updatedDebt = await context.entities.Debt.update({
    where: { id: args.id },
    data: updateData,
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

  return updatedDebt;
};

// ============================================================================
// Cancel Debt
// ============================================================================

export const cancelDebt: CancelDebt<CancelDebtInput, Debt> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can cancel debts');
  }

  // Get existing debt
  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!existingDebt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (existingDebt.deletedAt) {
    throw new HttpError(400, 'Cannot cancel deleted debt');
  }

  // Cannot cancel if already paid
  if (existingDebt.status === 'PAID') {
    throw new HttpError(400, 'Cannot cancel paid debt');
  }

  // Update notes with cancellation reason
  const updatedNotes = existingDebt.notes
    ? `${existingDebt.notes}\n\n[CANCELLED] ${args.reason || 'No reason provided'}`
    : `[CANCELLED] ${args.reason || 'No reason provided'}`;

  // Update debt
  const cancelledDebt = await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      status: 'CANCELLED',
      notes: updatedNotes,
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

  return cancelledDebt;
};

// ============================================================================
// Delete Debt (Soft Delete)
// ============================================================================

export const deleteDebt: DeleteDebt<DeleteDebtInput, { message: string; id: string }> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can delete
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can delete debts');
  }

  // Get existing debt
  const existingDebt = await context.entities.Debt.findUnique({
    where: { id: args.id },
  });

  if (!existingDebt) {
    throw new HttpError(404, 'Debt not found');
  }

  if (existingDebt.deletedAt) {
    throw new HttpError(400, 'Debt already deleted');
  }

  // Cannot delete if paid
  if (existingDebt.status === 'PAID') {
    throw new HttpError(400, 'Cannot delete paid debt');
  }

  // Soft delete
  await context.entities.Debt.update({
    where: { id: args.id },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    message: 'Debt deleted successfully',
    id: args.id,
  };
};
