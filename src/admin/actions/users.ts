import type { User } from 'wasp/entities';
import type {
  UpdateUserRole,
  UpdateUserStatus,
  DeleteUser,
} from 'wasp/server/operations';
import { HttpError, prisma } from 'wasp/server';

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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can create users
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Chỉ quản trị viên mới có thể tạo người dùng');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(args.email)) {
    throw new HttpError(400, 'Định dạng email không hợp lệ');
  }

  // Check if email already exists
  const existingUser = await context.entities.User.findUnique({
    where: { email: args.email },
  });

  if (existingUser) {
    throw new HttpError(400, 'Email đã tồn tại');
  }

  // Validate password
  if (!args.password || args.password.length < 8) {
    throw new HttpError(400, 'Mật khẩu phải có ít nhất 8 ký tự');
  }

  // Validate fullName
  if (!args.fullName || args.fullName.trim().length < 2) {
    throw new HttpError(400, 'Họ tên phải có ít nhất 2 ký tự');
  }

  // Validate role
  const validRoles = ['ADMIN', 'ACCOUNTING', 'OPS', 'DISPATCHER', 'DRIVER', 'CUSTOMER_OWNER', 'CUSTOMER_OPS'];
  if (!validRoles.includes(args.role)) {
    throw new HttpError(400, 'Vai trò không hợp lệ');
  }

  // Validate userType
  if (!['INTERNAL', 'CUSTOMER'].includes(args.userType)) {
    throw new HttpError(400, 'Loại tài khoản không hợp lệ');
  }

  // If CUSTOMER user, customerId is required
  if (args.userType === 'CUSTOMER' && !args.customerId) {
    throw new HttpError(400, 'Mã khách hàng là bắt buộc cho tài khoản khách hàng');
  }

  // If customerId provided, validate customer exists
  if (args.customerId) {
    const customer = await context.entities.Customer.findUnique({
      where: { id: args.customerId },
    });
    if (!customer) {
      throw new HttpError(404, 'Không tìm thấy khách hàng');
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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can update roles
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Chỉ quản trị viên mới có thể cập nhật vai trò người dùng');
  }

  // Cannot change own role
  if (user.id === args.userId) {
    throw new HttpError(400, 'Bạn không thể thay đổi vai trò của chính mình');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'Không tìm thấy người dùng');
  }

  // Validate role
  const validRoles = ['ADMIN', 'ACCOUNTING', 'OPS', 'DISPATCHER', 'DRIVER', 'CUSTOMER_OWNER', 'CUSTOMER_OPS'];
  if (!validRoles.includes(args.role)) {
    throw new HttpError(400, 'Vai trò không hợp lệ');
  }

  // Business rules validation
  // If changing to DRIVER, check if user has a driver profile
  if (args.role === 'DRIVER') {
    const userWithDriver = await context.entities.User.findUnique({
      where: { id: args.userId },
      include: { driver: true },
    });
    if (!userWithDriver?.driver) {
      throw new HttpError(400, 'Người dùng phải có hồ sơ tài xế để được gán vai trò TÀI XẾ');
    }
  }

  // If changing to CUSTOMER roles, user must have customerId
  if (['CUSTOMER_OWNER', 'CUSTOMER_OPS'].includes(args.role) && !targetUser.customerId) {
    throw new HttpError(400, 'Người dùng phải được liên kết với khách hàng để được gán vai trò khách hàng');
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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can update status
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Chỉ quản trị viên mới có thể cập nhật trạng thái người dùng');
  }

  // Cannot deactivate yourself
  if (user.id === args.userId && !args.isActive) {
    throw new HttpError(400, 'Bạn không thể vô hiệu hóa chính mình');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'Không tìm thấy người dùng');
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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can delete users
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Chỉ quản trị viên mới có thể xóa người dùng');
  }

  // Cannot delete yourself
  if (user.id === args.userId) {
    throw new HttpError(400, 'Bạn không thể xóa chính mình');
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
    throw new HttpError(404, 'Không tìm thấy người dùng');
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
      'Không thể xóa người dùng đã có dữ liệu. Vui lòng vô hiệu hóa tài khoản thay vì xóa.'
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
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions - Only ADMIN can force reset passwords
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Chỉ quản trị viên mới có thể đặt lại mật khẩu');
  }

  // Get target user
  const targetUser = await context.entities.User.findUnique({
    where: { id: args.userId },
  });

  if (!targetUser) {
    throw new HttpError(404, 'Không tìm thấy người dùng');
  }

  // Validate new password
  if (!args.newPassword || args.newPassword.length < 8) {
    throw new HttpError(400, 'Mật khẩu phải có ít nhất 8 ký tự');
  }

  // Import auth utils dynamically to avoid circular dependencies
  const { createProviderId, findAuthIdentity, updateAuthIdentityProviderData, getProviderDataWithPassword, sanitizeAndSerializeProviderData } =
    await import('wasp/auth/utils');

  // Find auth identity for email provider
  const providerId = createProviderId('email', targetUser.email);
  const authIdentity = await findAuthIdentity(providerId);

  if (!authIdentity) {
    // User has no Auth identity (created via SQL, not via Wasp auth)
    // Create Auth + AuthIdentity for this user
    const providerData = await sanitizeAndSerializeProviderData({
      hashedPassword: args.newPassword,
      isEmailVerified: true,
      emailVerificationSentAt: null,
      passwordResetSentAt: null,
    });

    await prisma.auth.create({
      data: {
        userId: targetUser.id,
        identities: {
          create: {
            providerName: 'email',
            providerUserId: targetUser.email,
            providerData,
          },
        },
      },
    });

    return {
      message: 'Auth identity created and password set. User can now login.',
    };
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
