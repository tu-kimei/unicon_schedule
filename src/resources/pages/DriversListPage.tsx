import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllDrivers, createDriver, updateDriver, deleteDriver } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { DriverFormModal, type DriverFormData } from '../components/DriverFormModal';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export const DriversListPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data: drivers, isLoading, error, refetch } = useQuery(getAllDrivers);

  const handleCreateDriver = async (data: DriverFormData) => {
    try {
      await createDriver(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEditDriver = async (data: DriverFormData) => {
    if (!editingDriver) return;
    try {
      await updateDriver({ id: editingDriver.id, ...data });
      setEditingDriver(null);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteDriver = async (e: React.MouseEvent, id: string, fullName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài xế ${fullName}?\n\nLưu ý: Chỉ có thể xóa tài xế chưa có chuyến đi nào.`)) {
      return;
    }
    try {
      await deleteDriver({ id });
      refetch();
    } catch (err: any) {
      if (err.message.includes('existing dispatches')) {
        alert('Không thể xóa tài xế này vì đã có chuyến đi liên quan');
      } else if (err.message.includes('Only ADMIN')) {
        alert('Chỉ ADMIN mới có quyền xóa tài xế');
      } else {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  // Filter drivers
  const filteredDrivers = drivers?.filter((driver: any) => {
    const matchSearch =
      driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || driver.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: drivers?.length || 0,
    active: drivers?.filter((d: any) => d.status === 'ACTIVE').length || 0,
    inactive: drivers?.filter((d: any) => d.status === 'INACTIVE').length || 0,
    suspended: drivers?.filter((d: any) => d.status === 'SUSPENDED').length || 0,
    licenseExpired: drivers?.filter((d: any) => isExpired(d.licenseExpiry)).length || 0,
    licenseExpiringSoon: drivers?.filter((d: any) => isExpiringSoon(d.licenseExpiry)).length || 0,
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-heading font-bold text-gray-900">Quản lý Tài xế</h1>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Thêm tài xế mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {!isLoading && drivers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Tổng tài xế" value={stats.total} color="blue" />
            <StatCard label="Đang hoạt động" value={stats.active} color="green" />
            <StatCard
              label="Bằng lái hết hạn"
              value={stats.licenseExpired}
              color={stats.licenseExpired > 0 ? 'red' : 'gray'}
            />
            <StatCard
              label="Sắp hết hạn (<30 ngày)"
              value={stats.licenseExpiringSoon}
              color={stats.licenseExpiringSoon > 0 ? 'yellow' : 'gray'}
            />
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {([
              { value: 'ALL', label: 'Tất cả' },
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'INACTIVE', label: 'Nghỉ' },
              { value: 'SUSPENDED', label: 'Tạm ngưng' },
            ] as { value: StatusFilter; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === value
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Drivers Table - Desktop */}
        {!isLoading && filteredDrivers && (
          <>
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tài xế
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bằng lái
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyến đi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.map((driver: any) => {
                      const expired = isExpired(driver.licenseExpiry);
                      const expiringSoon = isExpiringSoon(driver.licenseExpiry);

                      return (
                        <tr
                          key={driver.id}
                          onClick={() => navigate(`/resources/drivers/${driver.id}`)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {driver.fullName}
                            </div>
                            {driver.hometown && (
                              <div className="text-xs text-gray-500">{driver.hometown}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{driver.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-medium ${
                                expired
                                  ? 'text-red-600'
                                  : expiringSoon
                                    ? 'text-yellow-600'
                                    : 'text-gray-600'
                              }`}
                            >
                              {formatDate(driver.licenseExpiry)}
                            </div>
                            {expired && (
                              <span className="text-xs text-red-500 font-medium">Hết hạn</span>
                            )}
                            {expiringSoon && !expired && (
                              <span className="text-xs text-yellow-500 font-medium">Sắp hết hạn</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600">{driver.dispatchCount || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Tag variant={getStatusVariant(driver.status)}>
                              {getStatusLabel(driver.status)}
                            </Tag>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/resources/drivers/${driver.id}`);
                                }}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                Xem
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDriver(driver);
                                }}
                                className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                              >
                                Sửa
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={(e) => handleDeleteDriver(e, driver.id, driver.fullName)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredDrivers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'Không tìm thấy tài xế nào'
                    : 'Chưa có tài xế nào'}
                </div>
              )}
            </div>

            {/* Drivers Cards - Mobile */}
            <div className="md:hidden space-y-3">
              {filteredDrivers.map((driver: any) => {
                const expired = isExpired(driver.licenseExpiry);
                const expiringSoon = isExpiringSoon(driver.licenseExpiry);

                return (
                  <div
                    key={driver.id}
                    onClick={() => navigate(`/resources/drivers/${driver.id}`)}
                    className="bg-white rounded-lg shadow p-4 cursor-pointer active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.fullName}</h3>
                        <p className="text-sm text-gray-500">{driver.phone}</p>
                      </div>
                      <Tag variant={getStatusVariant(driver.status)} size="sm">
                        {getStatusLabel(driver.status)}
                      </Tag>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-500">Bằng lái: </span>
                          <span
                            className={`font-medium ${
                              expired
                                ? 'text-red-600'
                                : expiringSoon
                                  ? 'text-yellow-600'
                                  : 'text-gray-700'
                            }`}
                          >
                            {formatDate(driver.licenseExpiry)}
                            {expired && ' (Hết hạn)'}
                            {expiringSoon && !expired && ' (Sắp hết hạn)'}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-500">
                        {driver.dispatchCount || 0} chuyến
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDrivers.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'Không tìm thấy tài xế nào'
                    : 'Chưa có tài xế nào'}
                </div>
              )}
            </div>

            {/* Result count */}
            {filteredDrivers.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Hiển thị {filteredDrivers.length} / {drivers?.length || 0} tài xế
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Driver Modal */}
      <DriverFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDriver}
      />

      {/* Edit Driver Modal */}
      {editingDriver && (
        <DriverFormModal
          isOpen={true}
          onClose={() => setEditingDriver(null)}
          onSubmit={handleEditDriver}
          isEdit={true}
          initialData={{
            userId: editingDriver.userId,
            fullName: editingDriver.fullName,
            phone: editingDriver.phone,
            citizenIdImages: editingDriver.citizenIdImages,
            birthYear: editingDriver.birthYear,
            hometown: editingDriver.hometown || '',
            licenseImages: editingDriver.licenseImages,
            licenseExpiry: typeof editingDriver.licenseExpiry === 'string'
              ? editingDriver.licenseExpiry.split('T')[0]
              : new Date(editingDriver.licenseExpiry).toISOString().split('T')[0],
            status: editingDriver.status,
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// Helper Components & Functions
// ============================================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-500',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorStyles[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-80">{label}</div>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success' as const;
    case 'INACTIVE':
      return 'default' as const;
    case 'SUSPENDED':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';
    case 'INACTIVE':
      return 'Nghỉ';
    case 'SUSPENDED':
      return 'Tạm ngưng';
    default:
      return status;
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

function isExpired(date: string | Date) {
  return new Date(date) < new Date();
}

function isExpiringSoon(date: string | Date) {
  const expiryDate = new Date(date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
}
