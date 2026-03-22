import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getDriver, updateDriver, deleteDriver } from 'wasp/client/operations';
import { RoleGuard } from '../../shared/components/RoleGuard';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { DriverFormModal, type DriverFormData } from '../components/DriverFormModal';
import { ImageGallery } from '../../debt/components/ImageGallery';

export const DriverDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: driver, isLoading, error, refetch } = useQuery(getDriver, { id: id! });

  const handleEdit = async (data: DriverFormData) => {
    try {
      await updateDriver({ id: id!, ...data });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!driver) return;
    if (!confirm(`Bạn có chắc muốn xóa tài xế "${driver.fullName}"?`)) return;

    try {
      await deleteDriver({ id: driver.id });
      navigate('/resources/drivers');
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

  if (isLoading || !driver) {
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

  const expired = isExpired(driver.licenseExpiry);
  const expiringSoon = isExpiringSoon(driver.licenseExpiry);
  const daysUntil = getDaysUntilExpiry(driver.licenseExpiry);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OPS', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/resources/drivers')}>
                  ← Quay lại
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{driver.fullName}</h1>
                    <Tag variant={getStatusVariant(driver.status)}>
                      {getStatusLabel(driver.status)}
                    </Tag>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{driver.phone}</p>
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
          {/* License Alert Banner */}
          {(expired || expiringSoon) && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${
                expired
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${expired ? 'text-red-500' : 'text-yellow-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className={`font-medium ${expired ? 'text-red-800' : 'text-yellow-800'}`}>
                  {expired
                    ? `Bằng lái đã hết hạn ${Math.abs(daysUntil)} ngày`
                    : `Bằng lái sắp hết hạn trong ${daysUntil} ngày`}
                </p>
                <p className={`text-sm mt-1 ${expired ? 'text-red-600' : 'text-yellow-600'}`}>
                  Ngày hết hạn: {formatDate(driver.licenseExpiry)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
              </div>
              <div className="p-6 space-y-4">
                <InfoRow label="Họ và tên" value={driver.fullName} required />
                <InfoRow label="Số điện thoại" value={driver.phone} required />
                <InfoRow label="Năm sinh" value={driver.birthYear ? String(driver.birthYear) : null} />
                <InfoRow label="Quê quán" value={driver.hometown} />
                <InfoRow
                  label="Trạng thái"
                  required
                  value={
                    <Tag variant={getStatusVariant(driver.status)}>
                      {getStatusLabel(driver.status)}
                    </Tag>
                  }
                />
              </div>
            </div>

            {/* License Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Giấy phép lái xe</h2>
              </div>
              <div className="p-6 space-y-4">
                <InfoRow
                  label="Ngày hết hạn"
                  required
                  value={
                    <span
                      className={`font-semibold ${
                        expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-900'
                      }`}
                    >
                      {formatDate(driver.licenseExpiry)}
                      {expired && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Hết hạn
                        </span>
                      )}
                      {expiringSoon && !expired && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Còn {daysUntil} ngày
                        </span>
                      )}
                    </span>
                  }
                />
                <InfoRow label="User ID" value={<span className="text-xs font-mono text-gray-400">{driver.userId}</span>} />
                <InfoRow
                  label="Ngày tạo"
                  value={formatDate(driver.createdAt)}
                />
                <InfoRow
                  label="Cập nhật"
                  value={formatDate(driver.updatedAt)}
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Citizen ID Images */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Hình CCCD <span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="p-6">
                {driver.citizenIdImages && driver.citizenIdImages.length > 0 ? (
                  <ImageGallery images={driver.citizenIdImages} />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Chưa có hình CCCD</p>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-sm text-primary-600 hover:underline mt-1"
                    >
                      Tải lên ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* License Images */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Hình bằng lái <span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="p-6">
                {driver.licenseImages && driver.licenseImages.length > 0 ? (
                  <ImageGallery images={driver.licenseImages} />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Chưa có hình bằng lái</p>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-sm text-primary-600 hover:underline mt-1"
                    >
                      Tải lên ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Driver Modal */}
        {driver && (
          <DriverFormModal
            isOpen={isEditMode}
            onClose={() => setIsEditMode(false)}
            onSubmit={handleEdit}
            isEdit={true}
            initialData={{
              userId: driver.userId,
              fullName: driver.fullName,
              phone: driver.phone,
              citizenIdImages: driver.citizenIdImages,
              birthYear: driver.birthYear,
              hometown: driver.hometown || '',
              licenseImages: driver.licenseImages,
              licenseExpiry:
                typeof driver.licenseExpiry === 'string'
                  ? driver.licenseExpiry.split('T')[0]
                  : new Date(driver.licenseExpiry).toISOString().split('T')[0],
              status: driver.status,
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
  const days = getDaysUntilExpiry(date);
  return days <= 30 && days >= 0;
}

function getDaysUntilExpiry(date: string | Date) {
  const expiryDate = new Date(date);
  const today = new Date();
  return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
