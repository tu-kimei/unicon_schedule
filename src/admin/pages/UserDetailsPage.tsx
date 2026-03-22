import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getUser, updateUserRole, updateUserStatus, forceResetPassword } from 'wasp/client/operations';
import { RoleGuard } from '../../shared/components/RoleGuard';
import { RoleBadge } from '../components/RoleBadge';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { UserTypeBadge } from '../components/UserTypeBadge';

type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';

export function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('OPS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: user, isLoading, error, refetch } = useQuery(getUser, { id: id! });

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (selectedRole === user.role) {
      alert('Vai trò đã được thiết lập giá trị này');
      return;
    }

    if (confirm(`Bạn có chắc muốn thay đổi vai trò từ ${user.role} sang ${selectedRole}?`)) {
      setIsSubmitting(true);
      try {
        await updateUserRole({ userId: user.id, role: selectedRole });
        refetch();
        alert('Đã cập nhật vai trò thành công');
      } catch (err: any) {
        alert(err.message || 'Không thể cập nhật vai trò');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const newStatus = !user.isActive;
    if (confirm(`Bạn có chắc muốn ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} user này?`)) {
      setIsSubmitting(true);
      try {
        await updateUserStatus({ userId: user.id, isActive: newStatus });
        refetch();
        alert(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} user thành công`);
      } catch (err: any) {
        alert(err.message || 'Không thể cập nhật trạng thái');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForceResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate passwords
    if (newPassword.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    if (confirm(`Bạn có chắc muốn đặt lại mật khẩu cho user "${user.email}"?`)) {
      setIsSubmitting(true);
      try {
        await forceResetPassword({ userId: user.id, newPassword });
        setNewPassword('');
        setConfirmPassword('');
        setShowResetPassword(false);
        alert('Đã đặt lại mật khẩu thành công. User có thể đăng nhập với mật khẩu mới.');
      } catch (err: any) {
        alert(err.message || 'Không thể đặt lại mật khẩu');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Đang tải thông tin user...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Lỗi: {error?.message || 'Không tìm thấy user'}
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          ← Quay lại danh sách Users
        </button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Quay lại danh sách Users
          </button>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Chi tiết User</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Họ tên</label>
              <div className="mt-1 text-lg text-gray-900">{user.fullName}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <div className="mt-1 text-lg text-gray-900">{user.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Loại User</label>
              <div className="mt-1">
                <UserTypeBadge userType={user.userType} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Vai trò hiện tại</label>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Trạng thái</label>
              <div className="mt-1">
                <UserStatusBadge isActive={user.isActive} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Đăng nhập cuối</label>
              <div className="mt-1 text-gray-900">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('vi-VN')
                  : 'Chưa đăng nhập'}
              </div>
            </div>

            {user.customer && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Khách hàng</label>
                <div className="mt-1 text-gray-900">
                  {user.customer.name} ({user.customer.email})
                </div>
              </div>
            )}

            {user.driver && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Hồ sơ Tài xế</label>
                <div className="mt-1 text-gray-900">
                  SĐT: {user.driver.phone} | Trạng thái: {user.driver.status}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Role Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cập nhật Vai trò</h2>
        
          <form onSubmit={handleUpdateRole}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn vai trò mới
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                <option value="ADMIN">Admin</option>
                <option value="ACCOUNTING">Kế toán</option>
                <option value="OPS">Vận hành</option>
                <option value="DISPATCHER">Điều phối</option>
                <option value="DRIVER">Tài xế</option>
                <option value="CUSTOMER_OWNER">Chủ hàng</option>
                <option value="CUSTOMER_OPS">Vận hành KH</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || selectedRole === user.role}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
              </button>

              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  user.isActive
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {user.isActive ? 'Vô hiệu hóa User' : 'Kích hoạt User'}
              </button>
            </div>
          </form>
        </div>

        {/* Force Reset Password */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Đặt lại Mật khẩu</h2>
            {!showResetPassword && (
              <button
                onClick={() => setShowResetPassword(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                🔑 Force Reset Password
              </button>
            )}
          </div>

          {showResetPassword && (
            <form onSubmit={handleForceResetPassword} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Cảnh báo</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Bạn đang đặt lại mật khẩu cho user <strong>{user.email}</strong>.</p>
                      <p className="mt-1">User sẽ có thể đăng nhập ngay với mật khẩu mới.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tổng quan Hoạt động</h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Dispatches đã tạo</label>
              <div className="mt-1 text-2xl font-heading font-bold text-gray-900">
                {user.createdDispatches?.length || 0}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Công nợ đã tạo</label>
              <div className="mt-1 text-2xl font-heading font-bold text-gray-900">
                {user.createdDebts?.length || 0}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Tài khoản tạo lúc</label>
              <div className="mt-1 text-gray-900">
                {new Date(user.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Cập nhật cuối</label>
              <div className="mt-1 text-gray-900">
                {new Date(user.updatedAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {user.createdDispatches && user.createdDispatches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Dispatches gần đây</h3>
              <div className="space-y-2">
                {user.createdDispatches.slice(0, 5).map((dispatch: any) => (
                  <div key={dispatch.id} className="text-sm text-gray-600 flex justify-between">
                    <span>{dispatch.shipment.shipmentNumber}</span>
                    <span className="text-gray-400">{dispatch.shipment.currentStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.createdDebts && user.createdDebts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Công nợ gần đây</h3>
              <div className="space-y-2">
                {user.createdDebts.slice(0, 5).map((debt: any) => (
                  <div key={debt.id} className="text-sm text-gray-600 flex justify-between">
                    <span>{debt.customer.name} - {debt.debtMonth}</span>
                    <span className="text-gray-400">{Number(debt.amount).toLocaleString('vi-VN')} VND</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
