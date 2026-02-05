import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getDriver, updateDriver, deleteDriver } from 'wasp/client/operations';
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

    if (!confirm(`Bạn có chắc muốn xóa tài xế "${driver.fullName}"?`)) {
      return;
    }

    try {
      await deleteDriver({ id: driver.id });
      navigate('/resources/drivers');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Không hoạt động';
      case 'SUSPENDED': return 'Tạm ngưng';
      default: return status;
    }
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

  return (
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{driver.fullName}</h1>
                <p className="text-sm text-gray-600">{driver.phone}</p>
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
        {/* Driver Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin tài xế</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Họ và tên</label>
              <p className="font-medium">{driver.fullName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <p className="font-medium">{driver.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Năm sinh</label>
              <p className="font-medium">{driver.birthYear || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quê quán</label>
              <p className="font-medium">{driver.hometown || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">User ID</label>
              <p className="font-medium text-xs text-gray-500">{driver.userId}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Trạng thái</label>
              <div className="mt-1">
                <Tag variant={getStatusVariant(driver.status)}>
                  {getStatusLabel(driver.status)}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* License Expiry */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Giấy phép lái xe</h2>
          <div className={`p-4 rounded-lg ${
            isExpired(driver.licenseExpiry) ? 'bg-red-50 border border-red-200' :
            isExpiringSoon(driver.licenseExpiry) ? 'bg-yellow-50 border border-yellow-200' :
            'bg-gray-50'
          }`}>
            <label className="text-sm text-gray-600">Ngày hết hạn</label>
            <p className={`font-medium text-lg ${
              isExpired(driver.licenseExpiry) ? 'text-red-600' :
              isExpiringSoon(driver.licenseExpiry) ? 'text-yellow-600' :
              'text-gray-900'
            }`}>
              {formatDate(driver.licenseExpiry)}
            </p>
            {isExpired(driver.licenseExpiry) && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Đã hết hạn</p>
            )}
            {isExpiringSoon(driver.licenseExpiry) && !isExpired(driver.licenseExpiry) && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">⚠️ Sắp hết hạn (còn ≤ 30 ngày)</p>
            )}
          </div>
        </div>

        {/* Citizen ID Images */}
        {driver.citizenIdImages && driver.citizenIdImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Hình CCCD</h2>
            <ImageGallery images={driver.citizenIdImages} />
          </div>
        )}

        {/* License Images */}
        {driver.licenseImages && driver.licenseImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Hình bằng lái</h2>
            <ImageGallery images={driver.licenseImages} />
          </div>
        )}
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
            licenseExpiry: typeof driver.licenseExpiry === 'string' 
              ? driver.licenseExpiry.split('T')[0] 
              : new Date(driver.licenseExpiry).toISOString().split('T')[0],
            status: driver.status,
          }}
        />
      )}
    </div>
  );
};
