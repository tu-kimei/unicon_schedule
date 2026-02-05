import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllVehicles, createVehicle } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { VehicleFormModal, type VehicleFormData } from '../components/VehicleFormModal';

export const VehiclesListPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredVehicles = vehicles?.filter((vehicle: any) =>
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'IN_USE': return 'info';
      case 'MAINTENANCE': return 'warning';
      case 'OUT_OF_SERVICE': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Sẵn sàng';
      case 'IN_USE': return 'Đang sử dụng';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'OUT_OF_SERVICE': return 'Ngưng hoạt động';
      default: return status;
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Phương tiện</h1>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Thêm phương tiện mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo biển số xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Vehicles Table */}
        {!isLoading && filteredVehicles && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Hết hạn đăng kiểm
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle: any) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.licensePlate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {vehicle.vehicleType === 'TRACTOR' ? 'Đầu kéo' : 'Mooc'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {vehicle.company === 'KHANH_HUY' ? 'Khánh Huy' : 'Unicon'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tag variant={getStatusVariant(vehicle.status)}>
                          {getStatusLabel(vehicle.status)}
                        </Tag>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(vehicle.inspectionExpiryDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/resources/vehicles/${vehicle.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredVehicles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy phương tiện nào' : 'Chưa có phương tiện nào'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Vehicle Modal */}
      <VehicleFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateVehicle}
      />
    </div>
  );
};
