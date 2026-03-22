import type { GetAllCustomers, GetCustomer } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Get Customer
// ============================================================================

export const getCustomer: GetCustomer<{ id: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Bạn không có quyền xem khách hàng');
  }

  const customer = await context.entities.Customer.findUnique({
    where: { id: args.id },
  });

  if (!customer) {
    throw new HttpError(404, 'Không tìm thấy khách hàng');
  }

  return customer;
};

// ============================================================================
// Get All Customers
// ============================================================================

export const getAllCustomers: GetAllCustomers<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Bạn không có quyền xem khách hàng');
  }

  const customers = await context.entities.Customer.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return customers;
};
