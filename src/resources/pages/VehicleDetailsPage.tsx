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
    if (!confirm(`Bạn có chắc muốn xóa phương tiện "${vehicle.licensePlate}"?`)) return;

    try {
      await deleteVehicle({ id: vehicle.id });
      navigate('/resources/vehicles');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
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

  // Collect all expiry warnings
  const expiryItems = [
    { label: 'Vận hành', date: vehicle.operationExpiryDate },
    { label: 'Đăng kiểm', date: vehicle.inspectionExpiryDate },
    { label: 'Bảo hiểm', date: vehicle.insuranceExpiryDate },
  ];
  const alerts = expiryItems.filter((item) => isExpired(item.date) || isExpiringSoon(item.date));

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
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {vehicle.licensePlate}
                  </h1>
                  <Tag variant={getStatusVariant(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Tag>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {getVehicleTypeLabel(vehicle.vehicleType)} - {getCompanyLabel(vehicle.company)}
                  {vehicle.manufacturingYear && ` - SX ${vehicle.manufacturingYear}`}
                </p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Alert Banner */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium text-red-800">Cảnh báo giấy tờ</p>
                <ul className="mt-1 text-sm text-red-700 space-y-0.5">
                  {alerts.map((item) => (
                    <li key={item.label}>
                      {item.label}: {formatDate(item.date)}
                      {isExpired(item.date) ? ' (Hết hạn)' : ` (Còn ${getDaysUntil(item.date)} ngày)`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin phương tiện</h2>
            </div>
            <div className="p-6 space-y-4">
              <InfoRow label="Biển số xe" value={vehicle.licensePlate} required />
              <InfoRow label="Loại xe" value={getVehicleTypeLabel(vehicle.vehicleType)} required />
              <InfoRow label="Trực thuộc" value={getCompanyLabel(vehicle.company)} required />
              <InfoRow label="Năm sản xuất" value={vehicle.manufacturingYear ? String(vehicle.manufacturingYear) : null} />
              <InfoRow label="Vị trí hiện tại" value={vehicle.currentLocation} />
              <InfoRow
                label="Trạng thái"
                required
                value={
                  <Tag variant={getStatusVariant(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Tag>
                }
              />
            </div>
          </div>

          {/* Expiry Dates */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Ngày hết hạn</h2>
            </div>
            <div className="p-6 space-y-3">
              {expiryItems.map((item) => {
                const expired = isExpired(item.date);
                const expiring = isExpiringSoon(item.date);
                return (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      expired
                        ? 'bg-red-50 border border-red-200'
                        : expiring
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm text-gray-600">
                      {item.label} <span className="text-red-500">*</span>
                    </span>
                    <div className="text-right">
                      <span
                        className={`text-sm font-semibold ${
                          expired ? 'text-red-600' : expiring ? 'text-yellow-600' : 'text-gray-900'
                        }`}
                      >
                        {formatDate(item.date)}
                      </span>
                      {expired && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Hết hạn
                        </span>
                      )}
                      {expiring && !expired && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Còn {getDaysUntil(item.date)} ngày
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 space-y-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Ngày tạo</span>
                  <span>{formatDate(vehicle.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cập nhật</span>
                  <span>{formatDate(vehicle.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocSection
            title="Hình đăng ký"
            required
            images={vehicle.registrationImages}
            onUpload={() => setIsEditMode(true)}
          />
          <DocSection
            title="Hình đăng kiểm"
            required
            images={vehicle.inspectionImages}
            onUpload={() => setIsEditMode(true)}
          />
          <DocSection
            title="Hình bảo hiểm"
            required
            images={vehicle.insuranceImages}
            onUpload={() => setIsEditMode(true)}
          />
        </div>
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
            operationExpiryDate:
              typeof vehicle.operationExpiryDate === 'string'
                ? vehicle.operationExpiryDate.split('T')[0]
                : new Date(vehicle.operationExpiryDate).toISOString().split('T')[0],
            inspectionExpiryDate:
              typeof vehicle.inspectionExpiryDate === 'string'
                ? vehicle.inspectionExpiryDate.split('T')[0]
                : new Date(vehicle.inspectionExpiryDate).toISOString().split('T')[0],
            insuranceExpiryDate:
              typeof vehicle.insuranceExpiryDate === 'string'
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

// ============================================================================
// Helper Components & Functions
// ============================================================================

function InfoRow({
  label,
  value,
  required,
}: {
  label: string;
  value: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 whitespace-nowrap">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {value || <span className="text-gray-300">-</span>}
      </span>
    </div>
  );
}

function DocSection({
  title,
  required,
  images,
  onUpload,
}: {
  title: string;
  required?: boolean;
  images: string[];
  onUpload: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h2>
      </div>
      <div className="p-4">
        {images && images.length > 0 ? (
          <ImageGallery images={images} />
        ) : (
          <div className="text-center py-6 text-gray-400">
            <svg
              className="w-10 h-10 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Chưa có hình</p>
            <button onClick={onUpload} className="text-sm text-primary-600 hover:underline mt-1">
              Tải lên
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'IN_USE': return 'success' as const;
    case 'MAINTENANCE': return 'warning' as const;
    case 'OUT_OF_SERVICE': return 'danger' as const;
    default: return 'default' as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'IN_USE': return 'Đang dùng';
    case 'MAINTENANCE': return 'Bảo trì';
    case 'OUT_OF_SERVICE': return 'Ngưng';
    default: return status;
  }
}

function getVehicleTypeLabel(type: string) {
  return type === 'TRACTOR' ? 'Đầu kéo' : 'Mooc';
}

function getCompanyLabel(company: string) {
  switch (company) {
    case 'KHANH_HUY': return 'Khánh Huy';
    case 'UNICON': return 'Unicon';
    case 'RENTAL': return 'Thuê ngoài';
    default: return company;
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

function isExpired(date: string | Date) {
  return new Date(date) < new Date();
}

function isExpiringSoon(date: string | Date) {
  const days = getDaysUntil(date);
  return days <= 30 && days >= 0;
}

function getDaysUntil(date: string | Date) {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}
