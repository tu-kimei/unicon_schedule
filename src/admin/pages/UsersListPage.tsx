import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getAllUsers, updateUserStatus, deleteUser } from 'wasp/client/operations';
import { RoleBadge } from '../components/RoleBadge';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { UserTypeBadge } from '../components/UserTypeBadge';
import { CreateUserModal } from '../components/CreateUserModal';

type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';
type TabType = 'INTERNAL' | 'CUSTOMER';

export function UsersListPage() {
  const [activeTab, setActiveTab] = useState<TabType>('INTERNAL');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(getAllUsers, {
    userType: activeTab,
    role: roleFilter || undefined,
    isActive: statusFilter === '' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const users = data?.users || [];
  const summary = data?.summary;

  // Group customer users by customer
  const customerUsersByCustomer = users.reduce((acc: any, user: any) => {
    if (user.userType === 'CUSTOMER' && user.customer) {
      const customerId = user.customer.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: user.customer,
          users: [],
        };
      }
      acc[customerId].users.push(user);
    }
    return acc;
  }, {});

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (confirm(`Bạn có chắc muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} user này?`)) {
      try {
        await updateUserStatus({ userId, isActive: !currentStatus });
        refetch();
      } catch (err: any) {
        alert(err.message || 'Không thể cập nhật trạng thái user');
      }
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`Bạn có chắc muốn xóa user "${userEmail}"? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteUser({ userId });
        refetch();
        alert('Đã xóa user thành công');
      } catch (err: any) {
        alert(err.message || 'Không thể xóa user');
      }
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Lỗi: {error.message || 'Không thể tải danh sách users'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Quản lý Users</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý tài khoản, phân quyền và permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo User mới
        </button>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tổng Users</div>
            <div className="text-2xl font-heading font-bold text-gray-900">{summary.totalUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Đang hoạt động</div>
            <div className="text-2xl font-bold text-green-600">{summary.activeUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Nội bộ</div>
            <div className="text-2xl font-bold text-primary-600">{summary.internalUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Khách hàng</div>
            <div className="text-2xl font-bold text-orange-600">{summary.customerUsers}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('INTERNAL');
                setRoleFilter('');
              }}
              className={`${
                activeTab === 'INTERNAL'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              👤 Users Nội bộ
              {summary && (
                <span className="ml-2 bg-blue-100 text-primary-600 py-0.5 px-2 rounded-full text-xs">
                  {summary.internalUsers}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('CUSTOMER');
                setRoleFilter('');
              }}
              className={`${
                activeTab === 'CUSTOMER'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              🏢 Users Khách hàng
              {summary && (
                <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">
                  {summary.customerUsers}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Email hoặc tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Role Filter - Only for Internal tab */}
          {activeTab === 'INTERNAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="ACCOUNTING">Kế toán</option>
                <option value="OPS">Vận hành</option>
                <option value="DISPATCHER">Điều phối</option>
                <option value="DRIVER">Tài xế</option>
              </select>
            </div>
          )}

          {/* Role Filter - Only for Customer tab */}
          {activeTab === 'CUSTOMER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả vai trò</option>
                <option value="CUSTOMER_OWNER">Chủ hàng</option>
                <option value="CUSTOMER_OPS">Vận hành KH</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter === '' ? '' : statusFilter ? 'true' : 'false'}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === '' ? '' : val === 'true');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Đang tải danh sách users...
        </div>
      ) : activeTab === 'INTERNAL' ? (
        <InternalUsersTable
          users={users}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteUser}
        />
      ) : (
        <CustomerUsersView
          customerGroups={customerUsersByCustomer}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
}

// ============================================================================
// Internal Users Table
// ============================================================================

function InternalUsersTable({
  users,
  onToggleStatus,
  onDelete,
}: {
  users: any[];
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onDelete: (userId: string, email: string) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Không tìm thấy users
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đăng nhập cuối
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UserStatusBadge isActive={user.isActive} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('vi-VN')
                    : 'Chưa đăng nhập'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => onToggleStatus(user.id, user.isActive)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {user.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </button>
                    <button
                      onClick={() => onDelete(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Customer Users View (Grouped by Customer)
// ============================================================================

function CustomerUsersView({
  customerGroups,
  onToggleStatus,
  onDelete,
}: {
  customerGroups: any;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onDelete: (userId: string, email: string) => void;
}) {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const toggleCustomer = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const customerIds = Object.keys(customerGroups);

  if (customerIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Không tìm thấy users khách hàng
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {customerIds.map((customerId) => {
        const group = customerGroups[customerId];
        const isExpanded = expandedCustomers.has(customerId);

        return (
          <div key={customerId} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Customer Header */}
            <button
              onClick={() => toggleCustomer(customerId)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-orange-700">
                      {group.customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold text-gray-900">{group.customer.name}</div>
                  <div className="text-sm text-gray-500">{group.customer.email}</div>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {group.users.length} user{group.users.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Customer Users Table */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đăng nhập cuối
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserStatusBadge isActive={user.isActive} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('vi-VN')
                            : 'Chưa đăng nhập'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Sửa
                            </Link>
                            <button
                              onClick={() => onToggleStatus(user.id, user.isActive)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              {user.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                            </button>
                            <button
                              onClick={() => onDelete(user.id, user.email)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
