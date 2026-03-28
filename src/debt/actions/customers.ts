import type { Customer } from 'wasp/entities';
import type {
  CreateCustomer,
  UpdateCustomer,
  DeleteCustomer,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type PaymentTermType = 'DAYS' | 'MONTHS';
type StatementFrequency = 'MONTHLY_25' | 'MONTHLY_30' | 'WEEKLY' | 'BIMONTHLY';
type CustomerStatus = 'ACTIVE' | 'INACTIVE';

type CreateCustomerInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentTermDays: number;
  paymentTermType: PaymentTermType;
  statementFrequency?: StatementFrequency;
  hasVATInvoice: boolean;
  invoiceName?: string;
  taxCode?: string;
  taxAddress?: string;
  status: CustomerStatus;
};

type UpdateCustomerInput = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTermDays?: number;
  paymentTermType?: PaymentTermType;
  statementFrequency?: StatementFrequency;
  hasVATInvoice?: boolean;
  invoiceName?: string;
  taxCode?: string;
  taxAddress?: string;
  status?: CustomerStatus;
};

type DeleteCustomerInput = {
  id: string;
};

// ============================================================================
// Create Customer
// ============================================================================

export const createCustomer: CreateCustomer<CreateCustomerInput, Customer> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN, ACCOUNTING và OPS mới có thể tạo khách hàng');
  }

  // Validate email uniqueness
  const existingCustomer = await context.entities.Customer.findUnique({
    where: { email: args.email },
  });

  if (existingCustomer) {
    throw new HttpError(400, 'Email đã tồn tại');
  }

  // Validate payment terms
  if (args.paymentTermDays <= 0) {
    throw new HttpError(400, 'Số ngày thanh toán phải lớn hơn 0');
  }

  // Create customer
  const customer = await context.entities.Customer.create({
    data: {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      paymentTermDays: args.paymentTermDays,
      paymentTermType: args.paymentTermType,
      statementFrequency: args.statementFrequency,
      hasVATInvoice: args.hasVATInvoice,
      invoiceName: args.invoiceName,
      taxCode: args.taxCode,
      taxAddress: args.taxAddress,
      status: args.status,
    },
  });

  return customer;
};

// ============================================================================
// Update Customer
// ============================================================================

export const updateCustomer: UpdateCustomer<UpdateCustomerInput, Customer> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN, ACCOUNTING và OPS mới có thể cập nhật khách hàng');
  }

  // Get existing customer
  const existingCustomer = await context.entities.Customer.findUnique({
    where: { id: args.id },
  });

  if (!existingCustomer) {
    throw new HttpError(404, 'Không tìm thấy khách hàng');
  }

  // Validate email uniqueness if changing email
  if (args.email && args.email !== existingCustomer.email) {
    const emailExists = await context.entities.Customer.findUnique({
      where: { email: args.email },
    });

    if (emailExists) {
      throw new HttpError(400, 'Email đã tồn tại');
    }
  }

  // Validate payment terms if provided
  if (args.paymentTermDays !== undefined && args.paymentTermDays <= 0) {
    throw new HttpError(400, 'Số ngày thanh toán phải lớn hơn 0');
  }

  // Build update data
  const updateData: any = {};
  if (args.name !== undefined) updateData.name = args.name;
  if (args.email !== undefined) updateData.email = args.email;
  if (args.phone !== undefined) updateData.phone = args.phone;
  if (args.address !== undefined) updateData.address = args.address;
  if (args.paymentTermDays !== undefined) updateData.paymentTermDays = args.paymentTermDays;
  if (args.paymentTermType !== undefined) updateData.paymentTermType = args.paymentTermType;
  if (args.statementFrequency !== undefined) updateData.statementFrequency = args.statementFrequency;
  if (args.hasVATInvoice !== undefined) updateData.hasVATInvoice = args.hasVATInvoice;
  if (args.invoiceName !== undefined) updateData.invoiceName = args.invoiceName;
  if (args.taxCode !== undefined) updateData.taxCode = args.taxCode;
  if (args.taxAddress !== undefined) updateData.taxAddress = args.taxAddress;
  if (args.status !== undefined) updateData.status = args.status;

  // Update customer
  const updatedCustomer = await context.entities.Customer.update({
    where: { id: args.id },
    data: updateData,
  });

  return updatedCustomer;
};

// ============================================================================
// Delete Customer
// ============================================================================

export const deleteCustomer: DeleteCustomer<DeleteCustomerInput, Customer> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Chỉ ADMIN và ACCOUNTING mới có thể xóa khách hàng');
  }

  // Get existing customer
  const existingCustomer = await context.entities.Customer.findUnique({
    where: { id: args.id },
    include: {
      debts: true,
      shipments: true,
    },
  });

  if (!existingCustomer) {
    throw new HttpError(404, 'Không tìm thấy khách hàng');
  }

  // Check if customer has debts
  if (existingCustomer.debts.length > 0) {
    throw new HttpError(400, 'Không thể xóa khách hàng đã có công nợ');
  }

  // Check if customer has shipments
  if (existingCustomer.shipments.length > 0) {
    throw new HttpError(400, 'Không thể xóa khách hàng đã có chuyến hàng');
  }

  // Delete customer
  const deletedCustomer = await context.entities.Customer.delete({
    where: { id: args.id },
  });

  return deletedCustomer;
};
