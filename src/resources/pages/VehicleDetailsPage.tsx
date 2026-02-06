import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getVehicle, updateVehicle, deleteVehicle } from 'wasp/client/operations';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { VehicleFormModal, type VehicleFormData } from '../components/VehicleFormModal';
import { ImageGallery } from '../../debt/components/ImageGallery';

export const VehicleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: vehicle, isLoading, error, refetch } = useQuery(getVehicle, { id: id! });

  const handleEdit = async (data: VehicleFormData) => {
    try {
      await updateVehicle({ id: id!, ...data });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;

    if (!confirm(`Bạn có chắc muốn xóa phương tiện "${vehicle.licensePlate}"?`)) {
      return;
    }

    try {
      await deleteVehicle({ id: vehicle.id });
      navigate('/resources/vehicles');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'IN_USE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'OUT_OF_SERVICE': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_USE': return 'Đang sử dụng';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'OUT_OF_SERVICE': return 'Ngưng hoạt động';
      default: return status;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    return type === 'TRACTOR' ? 'Đầu kéo' : 'Mooc';
  };

  const getCompanyLabel = (company: string) => {
    return company === 'KHANH_HUY' ? 'Khánh Huy' : 'Unicon';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const isExpiringSoon = (date: string | Date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (date: string | Date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    return expiryDate < today;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/resources/vehicles')}>
                ← Quay lại
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{vehicle.licensePlate}</h1>
                <p className="text-sm text-gray-600">{getVehicleTypeLabel(vehicle.vehicleType)} - {getCompanyLabel(vehicle.company)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setIsEditMode(true)}>
                Chỉnh sửa
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Vehicle Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin phương tiện</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Biển số xe</label>
              <p className="font-medium">{vehicle.licensePlate}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Loại xe</label>
              <p className="font-medium">{getVehicleTypeLabel(vehicle.vehicleType)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Năm sản xuất</label>
              <p className="font-medium">{vehicle.manufacturingYear || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Trực thuộc công ty</label>
              <p className="font-medium">{getCompanyLabel(vehicle.company)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Vị trí hiện tại</label>
              <p className="font-medium">{vehicle.currentLocation || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Trạng thái</label>
              <div className="mt-1">
                <Tag variant={getStatusVariant(vehicle.status)}>
                  {getStatusLabel(vehicle.status)}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry Dates */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ngày hết hạn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isExpired(vehicle.operationExpiryDate) ? 'bg-red-50 border border-red-200' :
              isExpiringSoon(vehicle.operationExpiryDate) ? 'bg-yellow-50 border border-yellow-200' :
              'bg-gray-50'
            }`}>
              <label className="text-sm text-gray-600">Vận hành</label>
              <p className={`font-medium ${
                isExpired(vehicle.operationExpiryDate) ? 'text-red-600' :
                isExpiringSoon(vehicle.operationExpiryDate) ? 'text-yellow-600' :
                'text-gray-900'
              }`}>
                {formatDate(vehicle.operationExpiryDate)}
              </p>
              {isExpired(vehicle.operationExpiryDate) && (
                <p className="text-xs text-red-600 mt-1">Đã hết hạn</p>
              )}
              {isExpiringSoon(vehicle.operationExpiryDate) && !isExpired(vehicle.operationExpiryDate) && (
                <p className="text-xs text-yellow-600 mt-1">Sắp hết hạn</p>
              )}
            </div>

            <div className={`p-4 rounded-lg ${
              isExpired(vehicle.inspectionExpiryDate) ? 'bg-red-50 border border-red-200' :
              isExpiringSoon(vehicle.inspectionExpiryDate) ? 'bg-yellow-50 border border-yellow-200' :
              'bg-gray-50'
            }`}>
              <label className="text-sm text-gray-600">Đăng kiểm</label>
              <p className={`font-medium ${
                isExpired(vehicle.inspectionExpiryDate) ? 'text-red-600' :
                isExpiringSoon(vehicle.inspectionExpiryDate) ? 'text-yellow-600' :
                'text-gray-900'
              }`}>
                {formatDate(vehicle.inspectionExpiryDate)}
              </p>
              {isExpired(vehicle.inspectionExpiryDate) && (
                <p className="text-xs text-red-600 mt-1">Đã hết hạn</p>
              )}
              {isExpiringSoon(vehicle.inspectionExpiryDate) && !isExpired(vehicle.inspectionExpiryDate) && (
                <p className="text-xs text-yellow-600 mt-1">Sắp hết hạn</p>
              )}
            </div>

            <div className={`p-4 rounded-lg ${
              isExpired(vehicle.insuranceExpiryDate) ? 'bg-red-50 border border-red-200' :
              isExpiringSoon(vehicle.insuranceExpiryDate) ? 'bg-yellow-50 border border-yellow-200' :
              'bg-gray-50'
            }`}>
              <label className="text-sm text-gray-600">Bảo hiểm</label>
              <p className={`font-medium ${
                isExpired(vehicle.insuranceExpiryDate) ? 'text-red-600' :
                isExpiringSoon(vehicle.insuranceExpiryDate) ? 'text-yellow-600' :
                'text-gray-900'
              }`}>
                {formatDate(vehicle.insuranceExpiryDate)}
              </p>
              {isExpired(vehicle.insuranceExpiryDate) && (
                <p className="text-xs text-red-600 mt-1">Đã hết hạn</p>
              )}
              {isExpiringSoon(vehicle.insuranceExpiryDate) && !isExpired(vehicle.insuranceExpiryDate) && (
                <p className="text-xs text-yellow-600 mt-1">Sắp hết hạn</p>
              )}
            </div>
          </div>
        </div>

        {/* Registration Images */}
        {vehicle.registrationImages && vehicle.registrationImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Hình đăng ký</h2>
            <ImageGallery images={vehicle.registrationImages} />
          </div>
        )}

        {/* Inspection Images */}
        {vehicle.inspectionImages && vehicle.inspectionImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Hình đăng kiểm</h2>
            <ImageGallery images={vehicle.inspectionImages} />
          </div>
        )}

        {/* Insurance Images */}
        {vehicle.insuranceImages && vehicle.insuranceImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Hình bảo hiểm</h2>
            <ImageGallery images={vehicle.insuranceImages} />
          </div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {vehicle && (
        <VehicleFormModal
          isOpen={isEditMode}
          onClose={() => setIsEditMode(false)}
          onSubmit={handleEdit}
          isEdit={true}
          initialData={{
            licensePlate: vehicle.licensePlate,
            vehicleType: vehicle.vehicleType,
            manufacturingYear: vehicle.manufacturingYear,
            status: vehicle.status,
            registrationImages: vehicle.registrationImages,
            inspectionImages: vehicle.inspectionImages,
            insuranceImages: vehicle.insuranceImages,
            operationExpiryDate: typeof vehicle.operationExpiryDate === 'string'
              ? vehicle.operationExpiryDate.split('T')[0]
              : new Date(vehicle.operationExpiryDate).toISOString().split('T')[0],
            inspectionExpiryDate: typeof vehicle.inspectionExpiryDate === 'string'
              ? vehicle.inspectionExpiryDate.split('T')[0]
              : new Date(vehicle.inspectionExpiryDate).toISOString().split('T')[0],
            insuranceExpiryDate: typeof vehicle.insuranceExpiryDate === 'string'
              ? vehicle.insuranceExpiryDate.split('T')[0]
              : new Date(vehicle.insuranceExpiryDate).toISOString().split('T')[0],
            company: vehicle.company,
            currentLocation: vehicle.currentLocation || '',
          }}
        />
      )}
    </div>
  );
};
