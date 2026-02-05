import { useState, useEffect } from 'react';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { DatePicker } from '../../shared/components/DatePicker';
import { LocalImageUpload } from '../../shared/components/LocalImageUpload';
import { Dialog } from '../../shared/components/Dialog';
import { getSessionId } from 'wasp/client/api';

type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DriverFormData) => void;
  initialData?: DriverFormData;
  isEdit?: boolean;
}

export interface DriverFormData {
  userId: string;
  fullName: string;
  phone: string;
  citizenIdImages: string[];
  birthYear?: number;
  hometown?: string;
  licenseImages: string[];
  licenseExpiry: string;
  status: DriverStatus;
}

export const DriverFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: DriverFormModalProps) => {
  const [formData, setFormData] = useState<DriverFormData>({
    userId: initialData?.userId || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    citizenIdImages: initialData?.citizenIdImages || [],
    birthYear: initialData?.birthYear,
    hometown: initialData?.hometown || '',
    licenseImages: initialData?.licenseImages || [],
    licenseExpiry: initialData?.licenseExpiry || '',
    status: initialData?.status || 'ACTIVE',
  });

  // Local file storage (not uploaded yet)
  const [citizenIdFiles, setCitizenIdFiles] = useState<File[]>([]);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const uploadFiles = async (files: File[], type: 'citizen_id' | 'license'): Promise<string[]> => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add category and type for proper folder organization
    formData.append('category', 'drivers');
    formData.append('type', type);

    // Get session ID for authentication
    const sessionId = getSessionId();
    const headers: HeadersInit = {};
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }

    console.log('Uploading driver files to /api/upload...');
    console.log('Category: drivers, Type:', type);
    console.log('Files count:', files.length);
    console.log('Has session ID:', !!sessionId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include', // Include authentication cookies
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      console.error('Upload failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return data.urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one image exists for each required field
    const totalCitizenIdImages = formData.citizenIdImages.length + citizenIdFiles.length;
    const totalLicenseImages = formData.licenseImages.length + licenseFiles.length;
    
    if (totalCitizenIdImages === 0) {
      alert('Vui lòng tải lên ít nhất 1 hình CCCD');
      return;
    }
    
    if (totalLicenseImages === 0) {
      alert('Vui lòng tải lên ít nhất 1 hình bằng lái');
      return;
    }
    
    setIsUploading(true);

    try {
      // Upload all images to server with proper types
      const [citizenIdUrls, licenseUrls] = await Promise.all([
        uploadFiles(citizenIdFiles, 'citizen_id'),
        uploadFiles(licenseFiles, 'license'),
      ]);

      // Merge with existing images (for edit mode)
      const finalData = {
        ...formData,
        citizenIdImages: [...formData.citizenIdImages, ...citizenIdUrls],
        licenseImages: [...formData.licenseImages, ...licenseUrls],
      };

      onSubmit(finalData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (field: keyof DriverFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveExistingCitizenId = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      citizenIdImages: prev.citizenIdImages.filter((img) => img !== url),
    }));
  };

  const handleRemoveExistingLicense = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      licenseImages: prev.licenseImages.filter((img) => img !== url),
    }));
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'SUSPENDED', label: 'Tạm ngưng' },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Sửa tài xế' : 'Thêm tài xế mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      <form id="driver-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* User ID - Only for create mode */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="ID của user trong hệ thống"
            />
            <p className="text-xs text-gray-500 mt-1">
              User phải có role DRIVER và chưa là tài xế
            </p>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="VD: Nguyễn Văn A"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="0901234567"
          />
        </div>

        {/* Birth Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Năm sinh
          </label>
          <input
            type="number"
            min="1950"
            max={new Date().getFullYear() - 18}
            value={formData.birthYear || ''}
            onChange={(e) => handleChange('birthYear', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: 1990"
          />
        </div>

        {/* Hometown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quê quán
          </label>
          <input
            type="text"
            value={formData.hometown}
            onChange={(e) => handleChange('hometown', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Bình Định"
          />
        </div>

        {/* Citizen ID Images */}
        <LocalImageUpload
          label="Hình CCCD"
          value={citizenIdFiles}
          onChange={setCitizenIdFiles}
          existingImages={formData.citizenIdImages}
          onRemoveExisting={handleRemoveExistingCitizenId}
          required={!isEdit} // Only required for new drivers
          maxFiles={4}
        />

        {/* License Images */}
        <LocalImageUpload
          label="Hình bằng lái"
          value={licenseFiles}
          onChange={setLicenseFiles}
          existingImages={formData.licenseImages}
          onRemoveExisting={handleRemoveExistingLicense}
          required={!isEdit} // Only required for new drivers
          maxFiles={4}
        />

        {/* License Expiry */}
        <DatePicker
          label="Ngày hết hạn bằng lái"
          value={formData.licenseExpiry}
          onChange={(e) => handleChange('licenseExpiry', e.target.value)}
          required
        />

        {/* Status */}
        <Select
          label="Trạng thái"
          options={statusOptions}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as DriverStatus)}
          required
        />

      </form>
        {/* Actions */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 flex-shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" form="driver-form" disabled={isUploading}>
            {isUploading ? 'Đang tải ảnh lên...' : isEdit ? 'Cập nhật' : 'Thêm tài xế'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
