import type { Charge } from 'wasp/entities';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type ChargeType =
  | 'FREIGHT'
  | 'FUEL_SURCHARGE'
  | 'DETENTION'
  | 'DEMURRAGE'
  | 'LOADING'
  | 'UNLOADING'
  | 'CUSTOMS'
  | 'TOLL_FEE'
  | 'PARKING'
  | 'INSURANCE'
  | 'OTHER';

type CreateChargeInput = {
  shipmentId: string;
  chargeType: ChargeType;
  description?: string;
  quantity: number;
  unitPrice: number;
};

type UpdateChargeInput = {
  chargeId: string;
  chargeType?: ChargeType;
  description?: string;
  quantity?: number;
  unitPrice?: number;
};

type DeleteChargeInput = {
  chargeId: string;
};

// ============================================================================
// Create Charge
// ============================================================================

export const createCharge = async (args: CreateChargeInput, context: any): Promise<Charge> => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN, ACCOUNTING và OPS mới có thể tạo phí');
  }

  // Validate shipment exists
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
  });

  if (!shipment) {
    throw new HttpError(404, 'Không tìm thấy chuyến hàng');
  }

  // Validate inputs
  if (args.quantity <= 0) {
    throw new HttpError(400, 'Số lượng phải lớn hơn 0');
  }

  if (args.unitPrice < 0) {
    throw new HttpError(400, 'Đơn giá không được âm');
  }

  // Auto-calculate amount
  const amount = args.quantity * args.unitPrice;

  const charge = await context.entities.Charge.create({
    data: {
      shipmentId: args.shipmentId,
      chargeType: args.chargeType,
      description: args.description || null,
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      amount,
      createdById: user.id,
    },
    include: {
      shipment: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return charge;
};

// ============================================================================
// Update Charge
// ============================================================================

export const updateCharge = async (args: UpdateChargeInput, context: any): Promise<Charge> => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN và ACCOUNTING mới có thể cập nhật phí');
  }

  // Get existing charge
  const existingCharge = await context.entities.Charge.findUnique({
    where: { id: args.chargeId },
  });

  if (!existingCharge) {
    throw new HttpError(404, 'Không tìm thấy phí');
  }

  // Validate inputs
  if (args.quantity !== undefined && args.quantity <= 0) {
    throw new HttpError(400, 'Số lượng phải lớn hơn 0');
  }

  if (args.unitPrice !== undefined && args.unitPrice < 0) {
    throw new HttpError(400, 'Đơn giá không được âm');
  }

  // Prepare update data
  const updateData: any = {};

  if (args.chargeType !== undefined) updateData.chargeType = args.chargeType;
  if (args.description !== undefined) updateData.description = args.description;
  if (args.quantity !== undefined) updateData.quantity = args.quantity;
  if (args.unitPrice !== undefined) updateData.unitPrice = args.unitPrice;

  // Recalculate amount
  const quantity = args.quantity ?? existingCharge.quantity;
  const unitPrice = args.unitPrice ?? Number(existingCharge.unitPrice);
  updateData.amount = quantity * unitPrice;

  const updatedCharge = await context.entities.Charge.update({
    where: { id: args.chargeId },
    data: updateData,
    include: {
      shipment: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return updatedCharge;
};

// ============================================================================
// Delete Charge
// ============================================================================

export const deleteCharge = async (
  args: DeleteChargeInput,
  context: any
): Promise<{ message: string; id: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN và ACCOUNTING mới có thể xóa phí');
  }

  // Get existing charge
  const existingCharge = await context.entities.Charge.findUnique({
    where: { id: args.chargeId },
    include: {
      invoiceItem: true,
    },
  });

  if (!existingCharge) {
    throw new HttpError(404, 'Không tìm thấy phí');
  }

  // Cannot delete if linked to an invoice
  if (existingCharge.invoiceItem) {
    throw new HttpError(400, 'Không thể xóa phí đã liên kết với hóa đơn. Vui lòng xóa hóa đơn trước.');
  }

  await context.entities.Charge.delete({
    where: { id: args.chargeId },
  });

  return {
    message: 'Charge deleted successfully',
    id: args.chargeId,
  };
};
