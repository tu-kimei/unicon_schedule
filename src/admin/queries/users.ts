import type { GetAllUsers, GetUser } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';
type UserType = 'INTERNAL' | 'CUSTOMER';

type GetAllUsersInput = {
  role?: UserRole;
  userType?: UserType;
  isActive?: boolean;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type GetUserInput = {
  id: string;
};

// ============================================================================
// Get All Users
// ============================================================================

export const getAllUsers: GetAllUsers<GetAllUsersInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can view all users
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can view all users');
  }

  const {
    role,
    userType,
    isActive,
    customerId,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = args;

  // Build where clause
  const where: any = {};

  if (role) {
    where.role = role;
  }

  if (userType) {
    where.userType = userType;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  // Search by email or fullName
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await context.entities.User.count({ where });

  // Get users with pagination
  const users = await context.entities.User.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      driver: {
        select: {
          id: true,
          phone: true,
          status: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Calculate summary
  const summary = {
    totalUsers: total,
    activeUsers: await context.entities.User.count({ where: { ...where, isActive: true } }),
    inactiveUsers: await context.entities.User.count({ where: { ...where, isActive: false } }),
    internalUsers: await context.entities.User.count({ where: { ...where, userType: 'INTERNAL' } }),
    customerUsers: await context.entities.User.count({ where: { ...where, userType: 'CUSTOMER' } }),
    byRole: {
      admin: await context.entities.User.count({ where: { ...where, role: 'ADMIN' } }),
      accounting: await context.entities.User.count({ where: { ...where, role: 'ACCOUNTING' } }),
      ops: await context.entities.User.count({ where: { ...where, role: 'OPS' } }),
      dispatcher: await context.entities.User.count({ where: { ...where, role: 'DISPATCHER' } }),
      driver: await context.entities.User.count({ where: { ...where, role: 'DRIVER' } }),
      customerOwner: await context.entities.User.count({ where: { ...where, role: 'CUSTOMER_OWNER' } }),
      customerOps: await context.entities.User.count({ where: { ...where, role: 'CUSTOMER_OPS' } }),
    },
  };

  return {
    users,
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
// Get User by ID
// ============================================================================

export const getUser: GetUser<GetUserInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  // ADMIN can view any user, others can only view themselves
  if (user.role !== 'ADMIN' && user.id !== args.id) {
    throw new HttpError(403, 'You can only view your own profile');
  }

  const targetUser = await context.entities.User.findUnique({
    where: { id: args.id },
    include: {
      customer: true,
      driver: true,
      createdDispatches: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          shipment: {
            select: {
              id: true,
              shipmentNumber: true,
              currentStatus: true,
            },
          },
        },
      },
      createdDebts: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  return targetUser;
};
