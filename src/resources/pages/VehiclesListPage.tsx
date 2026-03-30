import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllVehicles, createVehicle, updateVehicle, deleteVehicle } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/RoleGuard';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { VehicleFormModal, type VehicleFormData } from '../components/VehicleFormModal';

type StatusFilter = 'ALL' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
type CompanyFilter = 'ALL' | 'KHANH_HUY' | 'UNICON' | 'RENTAL';

export const VehiclesListPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>('ALL');

  const { data: vehicles, isLoading, error, refetch } = useQuery(getAllVehicles);

  const handleCreateVehicle = async (data: VehicleFormData) => {
    try {
      await createVehicle(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEditVehicle = async (data: VehicleFormData) => {
    if (!editingVehicle) return;
    try {
      await updateVehicle({ id: editingVehicle.id, ...data });
      setEditingVehicle(null);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteVehicle = async (e: React.MouseEvent, id: string, licensePlate: string) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phương tiện ${licensePlate}?\n\nLưu ý: Chỉ có thể xóa phương tiện chưa có chuyến đi nào.`)) {
      return;
    }

    try {
      await deleteVehicle({ id });
      refetch();
      alert('Đã xóa phương tiện thành công');
    } catch (err: any) {
      if (err.message.includes('existing dispatches')) {
        alert('Không thể xóa phương tiện này vì đã có chuyến đi liên quan');
      } else if (err.message.includes('Only ADMIN')) {
        alert('Chỉ ADMIN mới có quyền xóa phương tiện');
      } else {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  // Sort by status group then nearest expiry
  const sortVehicles = (vehicleList: any[]) => {
    const statusOrder: Record<string, number> = {
      'IN_USE': 1,
      'MAINTENANCE': 2,
      'OUT_OF_SERVICE': 3,
    };

    return [...vehicleList].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      const dateA = getNearestExpiryDate(a).getTime();
      const dateB = getNearestExpiryDate(b).getTime();
      return dateA - dateB;
    });
  };

  // Filter vehicles
  const filteredVehicles = vehicles
    ? sortVehicles(
        vehicles.filter((vehicle: any) => {
          const matchSearch = vehicle.licensePlate
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;
          const matchCompany = companyFilter === 'ALL' || vehicle.company === companyFilter;
          return matchSearch && matchStatus && matchCompany;
        })
      )
    : [];

  // Stats
  const stats = {
    total: vehicles?.length || 0,
    inUse: vehicles?.filter((v: any) => v.status === 'IN_USE').length || 0,
    maintenance: vehicles?.filter((v: any) => v.status === 'MAINTENANCE').length || 0,
    outOfService: vehicles?.filter((v: any) => v.status === 'OUT_OF_SERVICE').length || 0,
    expiryWarnings: vehicles?.filter((v: any) => {
      return (
        isExpired(v.operationExpiryDate) ||
        isExpired(v.inspectionExpiryDate) ||
        isExpired(v.insuranceExpiryDate) ||
        isExpiringSoon(v.operationExpiryDate) ||
        isExpiringSoon(v.inspectionExpiryDate) ||
        isExpiringSoon(v.insuranceExpiryDate)
      );
    }).length || 0,
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
    <RoleGuard allowedRoles={['ADMIN', 'OPS', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-heading font-bold text-gray-900">Quản lý Phương tiện</h1>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                + Thêm phương tiện mới
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stat Cards */}
          {!isLoading && vehicles && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <StatCard label="Tổng phương tiện" value={stats.total} color="blue" />
              <StatCard label="Đang dùng" value={stats.inUse} color="green" />
              <StatCard label="Bảo trì" value={stats.maintenance} color="yellow" />
              <StatCard
                label="Ngưng hoạt động"
                value={stats.outOfService}
                color={stats.outOfService > 0 ? 'red' : 'gray'}
              />
              <StatCard
                label="Cảnh báo hết hạn"
                value={stats.expiryWarnings}
                color={stats.expiryWarnings > 0 ? 'red' : 'gray'}
              />
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search with icon */}
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
                  placeholder="Tìm kiếm theo biển số xe..."
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

              {/* Company filter dropdown */}
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value as CompanyFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
              >
                <option value="ALL">Tất cả công ty</option>
                <option value="KHANH_HUY">Khánh Huy</option>
                <option value="UNICON">Unicon</option>
                <option value="RENTAL">Thuê ngoài</option>
              </select>
            </div>

            {/* Status filter segmented control */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              {([
                { value: 'ALL', label: 'Tất cả' },
                { value: 'IN_USE', label: 'Đang dùng' },
                { value: 'MAINTENANCE', label: 'Bảo trì' },
                { value: 'OUT_OF_SERVICE', label: 'Ngưng' },
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

          {/* Vehicles Table & Cards */}
          {!isLoading && filteredVehicles && (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          STT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Biển số xe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại xe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Công ty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hạn gần nhất
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVehicles.map((vehicle: any, index: number) => {
                        const nearestExpiry = getNearestExpiryInfo(vehicle);

                        return (
                          <tr
                            key={vehicle.id}
                            onClick={() => navigate(`/resources/vehicles/${vehicle.id}`)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {vehicle.licensePlate}
                              </div>
                              {vehicle.manufacturingYear && (
                                <div className="text-xs text-gray-500">NSX: {vehicle.manufacturingYear}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  vehicle.vehicleType === 'TRACTOR'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {vehicle.vehicleType === 'TRACTOR' ? 'Đầu kéo' : 'Mooc'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {getCompanyLabel(vehicle.company)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tag variant={getStatusVariant(vehicle.status)}>
                                {getStatusLabel(vehicle.status)}
                              </Tag>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm font-medium ${
                                  nearestExpiry.expired
                                    ? 'text-red-600'
                                    : nearestExpiry.expiringSoon
                                      ? 'text-yellow-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                {formatDate(nearestExpiry.date)}
                              </div>
                              <div className="text-xs text-gray-400">{nearestExpiry.label}</div>
                              {nearestExpiry.expired && (
                                <span className="text-xs text-red-500 font-medium">Hết hạn</span>
                              )}
                              {nearestExpiry.expiringSoon && !nearestExpiry.expired && (
                                <span className="text-xs text-yellow-500 font-medium">Sắp hết hạn</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/resources/vehicles/${vehicle.id}`);
                                  }}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                  Xem
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingVehicle(vehicle);
                                  }}
                                  className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                                >
                                  Sửa
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={(e) => handleDeleteVehicle(e, vehicle.id, vehicle.licensePlate)}
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

                {filteredVehicles.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'ALL' || companyFilter !== 'ALL'
                      ? 'Không tìm thấy phương tiện nào'
                      : 'Chưa có phương tiện nào'}
                  </div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredVehicles.map((vehicle: any) => {
                  const nearestExpiry = getNearestExpiryInfo(vehicle);

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => navigate(`/resources/vehicles/${vehicle.id}`)}
                      className="bg-white rounded-lg shadow p-4 cursor-pointer active:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{vehicle.licensePlate}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                vehicle.vehicleType === 'TRACTOR'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {vehicle.vehicleType === 'TRACTOR' ? 'Đầu kéo' : 'Mooc'}
                            </span>
                            <span className="text-xs text-gray-500">{getCompanyLabel(vehicle.company)}</span>
                          </div>
                        </div>
                        <Tag variant={getStatusVariant(vehicle.status)} size="sm">
                          {getStatusLabel(vehicle.status)}
                        </Tag>
                      </div>

                      <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-gray-500">{nearestExpiry.label}: </span>
                          <span
                            className={`font-medium ${
                              nearestExpiry.expired
                                ? 'text-red-600'
                                : nearestExpiry.expiringSoon
                                  ? 'text-yellow-600'
                                  : 'text-gray-700'
                            }`}
                          >
                            {formatDate(nearestExpiry.date)}
                            {nearestExpiry.expired && ' (Hết hạn)'}
                            {nearestExpiry.expiringSoon && !nearestExpiry.expired && ' (Sắp hết hạn)'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile action buttons */}
                      <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVehicle(vehicle);
                          }}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => handleDeleteVehicle(e, vehicle.id, vehicle.licensePlate)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredVehicles.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'ALL' || companyFilter !== 'ALL'
                      ? 'Không tìm thấy phương tiện nào'
                      : 'Chưa có phương tiện nào'}
                  </div>
                )}
              </div>

              {/* Result count */}
              {filteredVehicles.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Hiển thị {filteredVehicles.length} / {vehicles?.length || 0} phương tiện
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Vehicle Modal */}
        <VehicleFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateVehicle}
        />

        {/* Edit Vehicle Modal */}
        {editingVehicle && (
          <VehicleFormModal
            isOpen={true}
            onClose={() => setEditingVehicle(null)}
            onSubmit={handleEditVehicle}
            isEdit={true}
            initialData={{
              licensePlate: editingVehicle.licensePlate,
              vehicleType: editingVehicle.vehicleType,
              manufacturingYear: editingVehicle.manufacturingYear,
              status: editingVehicle.status,
              registrationImages: editingVehicle.registrationImages || [],
              inspectionImages: editingVehicle.inspectionImages || [],
              insuranceImages: editingVehicle.insuranceImages || [],
              operationExpiryDate: typeof editingVehicle.operationExpiryDate === 'string'
                ? editingVehicle.operationExpiryDate.split('T')[0]
                : new Date(editingVehicle.operationExpiryDate).toISOString().split('T')[0],
              inspectionExpiryDate: typeof editingVehicle.inspectionExpiryDate === 'string'
                ? editingVehicle.inspectionExpiryDate.split('T')[0]
                : new Date(editingVehicle.inspectionExpiryDate).toISOString().split('T')[0],
              insuranceExpiryDate: typeof editingVehicle.insuranceExpiryDate === 'string'
                ? editingVehicle.insuranceExpiryDate.split('T')[0]
                : new Date(editingVehicle.insuranceExpiryDate).toISOString().split('T')[0],
              company: editingVehicle.company,
              currentLocation: editingVehicle.currentLocation || '',
            }}
          />
        )}
      </div>
    </RoleGuard>
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
    case 'IN_USE':
      return 'success' as const;
    case 'MAINTENANCE':
      return 'warning' as const;
    case 'OUT_OF_SERVICE':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'IN_USE':
      return 'Đang dùng';
    case 'MAINTENANCE':
      return 'Bảo trì';
    case 'OUT_OF_SERVICE':
      return 'Ngưng';
    default:
      return status;
  }
}

function getCompanyLabel(company: string) {
  switch (company) {
    case 'KHANH_HUY':
      return 'Khánh Huy';
    case 'UNICON':
      return 'Unicon';
    case 'RENTAL':
      return 'Thuê ngoài';
    default:
      return company;
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

function getNearestExpiryDate(vehicle: any): Date {
  const dates = [
    new Date(vehicle.operationExpiryDate),
    new Date(vehicle.inspectionExpiryDate),
    new Date(vehicle.insuranceExpiryDate),
  ];
  return dates.reduce((nearest, d) => (d < nearest ? d : nearest), dates[0]);
}

function getNearestExpiryInfo(vehicle: any): {
  date: Date;
  label: string;
  expired: boolean;
  expiringSoon: boolean;
} {
  const entries = [
    { date: new Date(vehicle.operationExpiryDate), label: 'Vận hành' },
    { date: new Date(vehicle.inspectionExpiryDate), label: 'Đăng kiểm' },
    { date: new Date(vehicle.insuranceExpiryDate), label: 'Bảo hiểm' },
  ];

  const nearest = entries.reduce((min, entry) =>
    entry.date < min.date ? entry : min
  , entries[0]);

  return {
    date: nearest.date,
    label: nearest.label,
    expired: isExpired(nearest.date),
    expiringSoon: isExpiringSoon(nearest.date),
  };
}
