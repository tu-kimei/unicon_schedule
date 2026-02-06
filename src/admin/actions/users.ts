import type { User } from 'wasp/entities';
import type {
  UpdateUserRole,
  UpdateUserStatus,
  DeleteUser,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';
type UserType = 'INTERNAL' | 'CUSTOMER';

type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  userType: UserType;
  customerId?: string;
};

type UpdateUserRoleInput = {
  userId: string;
  role: UserRole;
};

type UpdateUserStatusInput = {
  userId: string;
  isActive: boolean;
};

type DeleteUserInput = {
  userId: string;
};

type ForceResetPasswordInput = {
  userId: string;
  newPassword: string;
};

// ============================================================================
// Create User
// ============================================================================

export const createUser = async (args: CreateUserInput, context: any): Promise<User> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can create users
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can create users');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(args.email)) {
    throw new HttpError(400, 'Invalid email format');
  }

  // Check if email already exists
  const existingUser = await context.entities.User.findUnique({
    where: { email: args.email },
  });

  if (existingUser) {
    throw new HttpError(400, 'Email already exists');
  }

  // Validate password
  if (!args.password || args.password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long');
  }

  // Validate fullName
  if (!args.fullName || args.fullName.trim().length < 2) {
    throw new HttpError(400, 'Full name must be at least 2 characters long');
  }

  // Validate role
  const validRoles = ['ADMIN', 'ACCOUNTING', 'OPS', 'DISPATCHER', 'DRIVER', 'CUSTOMER_OWNER', 'CUSTOMER_OPS'];
  if (!validRoles.includes(args.role)) {
    throw new HttpError(400, 'Invalid role');
  }

  // Validate userType
  if (!['INTERNAL', 'CUSTOMER'].includes(args.userType)) {
    throw new HttpError(400, 'Invalid user type');
  }

  // If CUSTOMER user, customerId is required
  if (args.userType === 'CUSTOMER' && !args.customerId) {
    throw new HttpError(400, 'Customer ID is required for customer users');
  }

  // If customerId provided, validate customer exists
  if (args.customerId) {
    const customer = await context.entities.Customer.findUnique({
      where: { id: args.customerId },
    });
    if (!customer) {
      throw new HttpError(404, 'Customer not found');
    }
  }

  // Import auth utils to create user with auth
  const { createProviderId, createUser: createAuthUser, sanitizeAndSerializeProviderData } = 
    await import('wasp/auth/utils');

  const providerId = createProviderId('email', args.email);
  
  // Prepare provider data with password
  const providerData = await sanitizeAndSerializeProviderData({
    hashedPassword: args.password,
    isEmailVerified: true, // Auto-verify for admin-created users
    emailVerificationSentAt: null,
    passwordResetSentAt: null,
  });

  // Create user with auth
  // Note: email is already in providerId, so we need to add it to userFields
  const newUser = await createAuthUser(
    providerId,
    providerData,
    {
      email: args.email, // Add email explicitly
      fullName: args.fullName,
      userType: args.userType,
      role: args.role,
      ...(args.customerId ? { customer: { connect: { id: args.customerId } } } : {}),
      isActive: true,
    }
  );

  return newUser;
};

// ============================================================================
// Update User Role
// ============================================================================

export const updateUserRole: UpdateUserRole<UpdateUserRoleInput, User> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can update roles
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can update user roles');
  }

  // Cannot change own role
  if (user.id === args.userId) {
    throw new HttpError(400, 'You cannot change your own role');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Validate role
  const validRoles = ['ADMIN', 'ACCOUNTING', 'OPS', 'DISPATCHER', 'DRIVER', 'CUSTOMER_OWNER', 'CUSTOMER_OPS'];
  if (!validRoles.includes(args.role)) {
    throw new HttpError(400, 'Invalid role');
  }

  // Business rules validation
  // If changing to DRIVER, check if user has a driver profile
  if (args.role === 'DRIVER') {
    const userWithDriver = await context.entities.User.findUnique({
      where: { id: args.userId },
      include: { driver: true },
    });
    if (!userWithDriver?.driver) {
      throw new HttpError(400, 'User must have a driver profile to be assigned DRIVER role');
    }
  }

  // If changing to CUSTOMER roles, user must have customerId
  if (['CUSTOMER_OWNER', 'CUSTOMER_OPS'].includes(args.role) && !targetUser.customerId) {
    throw new HttpError(400, 'User must be linked to a customer to be assigned customer roles');
  }

  // Update user role
  const updatedUser = await context.entities.User.update({
    where: { id: args.userId },
    data: {
      role: args.role,
      // Auto-update userType based on role
      userType: ['CUSTOMER_OWNER', 'CUSTOMER_OPS'].includes(args.role) ? 'CUSTOMER' : 'INTERNAL',
    },
    include: {
      customer: true,
      driver: true,
    },
  });

  return updatedUser;
};

// ============================================================================
// Update User Status (Active/Inactive)
// ============================================================================

export const updateUserStatus: UpdateUserStatus<UpdateUserStatusInput, User> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can update status
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can update user status');
  }

  // Cannot deactivate yourself
  if (user.id === args.userId && !args.isActive) {
    throw new HttpError(400, 'You cannot deactivate yourself');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Update user status
  const updatedUser = await context.entities.User.update({
    where: { id: args.userId },
    data: {
      isActive: args.isActive,
    },
    include: {
      customer: true,
      driver: true,
    },
  });

  return updatedUser;
};

// ============================================================================
// Delete User
// ============================================================================

export const deleteUser: DeleteUser<DeleteUserInput, { message: string; id: string }> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can delete users
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can delete users');
  }

  // Cannot delete yourself
  if (user.id === args.userId) {
    throw new HttpError(400, 'You cannot delete yourself');
  }

  // Get target user with relations
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
    include: {
      driver: {
        include: {
          dispatches: true,
        },
      },
      createdDispatches: true,
      createdStatusEvents: true,
      uploadedPODs: true,
      createdDebts: true,
    },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Check if user has related data
  const hasDispatches = targetUser.createdDispatches.length > 0;
  const hasStatusEvents = targetUser.createdStatusEvents.length > 0;
  const hasPODs = targetUser.uploadedPODs.length > 0;
  const hasDebts = targetUser.createdDebts.length > 0;
  const hasDriverDispatches = targetUser.driver?.dispatches ? targetUser.driver.dispatches.length > 0 : false;

  if (hasDispatches || hasStatusEvents || hasPODs || hasDebts || hasDriverDispatches) {
    throw new HttpError(
      400,
      'Cannot delete user with existing data. Please deactivate the user instead.'
    );
  }

  // Delete user (this will cascade delete Auth, AuthIdentity, Session, Driver if exists)
  await context.entities.User.delete({
    where: { id: args.userId },
  });

  return {
    message: 'User deleted successfully',
    id: args.userId,
  };
};

// ============================================================================
// Force Reset Password
// ============================================================================

export const forceResetPassword = async (
  args: ForceResetPasswordInput,
  context: any
): Promise<{ message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can force reset passwords
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only ADMIN can force reset passwords');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  // Validate new password
  if (!args.newPassword || args.newPassword.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long');
  }

  // Import auth utils dynamically to avoid circular dependencies
  const { createProviderId, findAuthIdentity, updateAuthIdentityProviderData, getProviderDataWithPassword } = 
    await import('wasp/auth/utils');

  // Find auth identity for email provider
  const providerId = createProviderId('email', targetUser.email);
  const authIdentity = await findAuthIdentity(providerId);

  if (!authIdentity) {
    throw new HttpError(404, 'Auth identity not found for this user');
  }

  // Get current provider data
  const providerData = getProviderDataWithPassword<'email'>(authIdentity.providerData);

  // Update password (will be hashed automatically by updateAuthIdentityProviderData)
  await updateAuthIdentityProviderData(providerId, providerData, {
    hashedPassword: args.newPassword,
  });

  return {
    message: 'Password reset successfully. User can now login with the new password.',
  };
};
