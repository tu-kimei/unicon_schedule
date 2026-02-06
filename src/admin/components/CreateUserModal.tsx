import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllCustomers, createUser } from 'wasp/client/operations';

type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';
type UserType = 'INTERNAL' | 'CUSTOMER';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<UserType>('INTERNAL');
  const [role, setRole] = useState<UserRole>('OPS');
  const [customerId, setCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customersData } = useQuery(getAllCustomers);
  const customers = customersData || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    // Validate customer for CUSTOMER userType
    if (userType === 'CUSTOMER' && !customerId) {
      alert('Vui lòng chọn khách hàng cho user khách hàng');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        userType,
        customerId: userType === 'CUSTOMER' ? customerId : undefined,
      });
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setUserType('INTERNAL');
      setRole('OPS');
      setCustomerId('');
      
      alert('Tạo user thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Không thể tạo user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setUserType('INTERNAL');
      setRole('OPS');
      setCustomerId('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tạo User mới</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại User <span className="text-red-500">*</span>
              </label>
              <select
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value as UserType);
                  // Reset role when changing userType
                  if (e.target.value === 'INTERNAL') {
                    setRole('OPS');
                    setCustomerId('');
                  } else {
                    setRole('CUSTOMER_OPS');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="INTERNAL">Nội bộ</option>
                <option value="CUSTOMER">Khách hàng</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {userType === 'INTERNAL' ? (
                  <>
                    <option value="ADMIN">Admin</option>
                    <option value="ACCOUNTING">Kế toán</option>
                    <option value="OPS">Vận hành</option>
                    <option value="DISPATCHER">Điều phối</option>
                    <option value="DRIVER">Tài xế</option>
                  </>
                ) : (
                  <>
                    <option value="CUSTOMER_OWNER">Chủ hàng</option>
                    <option value="CUSTOMER_OPS">Vận hành KH</option>
                  </>
                )}
              </select>
            </div>

            {/* Customer Selection - Only for CUSTOMER userType */}
            {userType === 'CUSTOMER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Lưu ý</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>User sẽ được tạo với trạng thái Active</li>
                      <li>Email sẽ được tự động verify</li>
                      <li>User có thể đăng nhập ngay với mật khẩu đã tạo</li>
                      {userType === 'CUSTOMER' && (
                        <li>User khách hàng chỉ xem được data của công ty mình</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
