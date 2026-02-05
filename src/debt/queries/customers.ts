import type { GetAllCustomers, GetCustomer } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Get Customer
// ============================================================================

export const getCustomer: GetCustomer<{ id: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view customers');
  }

  const customer = await context.entities.Customer.findUnique({
    where: { id: args.id },
  });

  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }

  return customer;
};

// ============================================================================
// Get All Customers
// ============================================================================

export const getAllCustomers: GetAllCustomers<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'You do not have permission to view customers');
  }

  const customers = await context.entities.Customer.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return customers;
};
