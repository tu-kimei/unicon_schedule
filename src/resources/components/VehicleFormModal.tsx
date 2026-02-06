import { useState, useEffect } from 'react';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { DatePicker } from '../../shared/components/DatePicker';
import { LocalImageUpload } from '../../shared/components/LocalImageUpload';
import { Dialog } from '../../shared/components/Dialog';
import { getSessionId } from 'wasp/client/api';

type VehicleType = 'TRACTOR' | 'TRAILER';
type VehicleStatus = 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
type VehicleCompany = 'KHANH_HUY' | 'UNICON';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData) => void;
  initialData?: VehicleFormData;
  isEdit?: boolean;
}

export interface VehicleFormData {
  licensePlate: string;
  vehicleType: VehicleType;
  manufacturingYear?: number;
  status: VehicleStatus;
  registrationImages: string[];
  inspectionImages: string[];
  insuranceImages: string[];
  operationExpiryDate: string;
  inspectionExpiryDate: string;
  insuranceExpiryDate: string;
  company: VehicleCompany;
  currentLocation?: string;
}

export const VehicleFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: VehicleFormModalProps) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    licensePlate: initialData?.licensePlate || '',
    vehicleType: initialData?.vehicleType || 'TRACTOR',
    manufacturingYear: initialData?.manufacturingYear,
    status: initialData?.status || 'IN_USE',
    registrationImages: initialData?.registrationImages || [],
    inspectionImages: initialData?.inspectionImages || [],
    insuranceImages: initialData?.insuranceImages || [],
    operationExpiryDate: initialData?.operationExpiryDate || '',
    inspectionExpiryDate: initialData?.inspectionExpiryDate || '',
    insuranceExpiryDate: initialData?.insuranceExpiryDate || '',
    company: initialData?.company || 'UNICON',
    currentLocation: initialData?.currentLocation || '',
  });

  // Local file storage (not uploaded yet)
  const [registrationFiles, setRegistrationFiles] = useState<File[]>([]);
  const [inspectionFiles, setInspectionFiles] = useState<File[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const uploadFiles = async (files: File[], type: 'registration' | 'inspection' | 'insurance'): Promise<string[]> => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add category and type for proper folder organization
    formData.append('category', 'vehicles');
    formData.append('type', type);

    // Get session ID for authentication
    const sessionId = getSessionId();
    const headers: HeadersInit = {};
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }

    console.log('Uploading vehicle files to /api/upload...');
    console.log('Category: vehicles, Type:', type);
    console.log('Files count:', files.length);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
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
    
    // Validate that at least one image exists for required fields
    const totalRegistrationImages = formData.registrationImages.length + registrationFiles.length;
    const totalInspectionImages = formData.inspectionImages.length + inspectionFiles.length;
    
    if (totalRegistrationImages === 0) {
      alert('Vui lòng tải lên ít nhất 1 hình đăng ký');
      return;
    }
    
    if (totalInspectionImages === 0) {
      alert('Vui lòng tải lên ít nhất 1 hình đăng kiểm');
      return;
    }
    
    setIsUploading(true);

    try {
      // Upload all images to server with proper types
      const [registrationUrls, inspectionUrls, insuranceUrls] = await Promise.all([
        uploadFiles(registrationFiles, 'registration'),
        uploadFiles(inspectionFiles, 'inspection'),
        uploadFiles(insuranceFiles, 'insurance'),
      ]);

      // Merge with existing images (for edit mode)
      const finalData = {
        ...formData,
        registrationImages: [...formData.registrationImages, ...registrationUrls],
        inspectionImages: [...formData.inspectionImages, ...inspectionUrls],
        insuranceImages: [...formData.insuranceImages, ...insuranceUrls],
      };

      onSubmit(finalData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (field: keyof VehicleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveExistingRegistration = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      registrationImages: prev.registrationImages.filter((img) => img !== url),
    }));
  };

  const handleRemoveExistingInspection = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      inspectionImages: prev.inspectionImages.filter((img) => img !== url),
    }));
  };

  const handleRemoveExistingInsurance = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      insuranceImages: prev.insuranceImages.filter((img) => img !== url),
    }));
  };

  const vehicleTypeOptions = [
    { value: 'TRACTOR', label: 'Đầu kéo' },
    { value: 'TRAILER', label: 'Mooc' },
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Sẵn sàng' },
    { value: 'IN_USE', label: 'Đang sử dụng' },
    { value: 'MAINTENANCE', label: 'Bảo trì' },
    { value: 'OUT_OF_SERVICE', label: 'Ngưng hoạt động' },
  ];

  const companyOptions = [
    { value: 'KHANH_HUY', label: 'Khánh Huy' },
    { value: 'UNICON', label: 'Unicon' },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Sửa phương tiện' : 'Thêm phương tiện mới'}
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
      <form id="vehicle-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* License Plate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Biển số xe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.licensePlate}
            onChange={(e) => handleChange('licensePlate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="VD: 51A-12345"
          />
        </div>

        {/* Vehicle Type */}
        <Select
          label="Loại xe"
          options={vehicleTypeOptions}
          value={formData.vehicleType}
          onChange={(e) => handleChange('vehicleType', e.target.value as VehicleType)}
          required
        />

        {/* Manufacturing Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Năm sản xuất
          </label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.manufacturingYear || ''}
            onChange={(e) => handleChange('manufacturingYear', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: 2020"
          />
        </div>

        {/* Company */}
        <Select
          label="Trực thuộc công ty"
          options={companyOptions}
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value as VehicleCompany)}
          required
        />

        {/* Status */}
        <Select
          label="Trạng thái"
          options={statusOptions}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as VehicleStatus)}
          required
        />

        {/* Registration Images */}
        <LocalImageUpload
          label="Hình đăng ký"
          value={registrationFiles}
          onChange={setRegistrationFiles}
          existingImages={formData.registrationImages}
          onRemoveExisting={handleRemoveExistingRegistration}
          required={!isEdit}
          maxFiles={4}
        />

        {/* Inspection Images */}
        <LocalImageUpload
          label="Hình đăng kiểm"
          value={inspectionFiles}
          onChange={setInspectionFiles}
          existingImages={formData.inspectionImages}
          onRemoveExisting={handleRemoveExistingInspection}
          required={!isEdit}
          maxFiles={4}
        />

        {/* Insurance Images */}
        <LocalImageUpload
          label="Hình bảo hiểm"
          value={insuranceFiles}
          onChange={setInsuranceFiles}
          existingImages={formData.insuranceImages}
          onRemoveExisting={handleRemoveExistingInsurance}
          required={!isEdit}
          maxFiles={4}
        />

        {/* Expiry Dates */}
        <DatePicker
          label="Ngày hết hạn vận hành"
          value={formData.operationExpiryDate}
          onChange={(e) => handleChange('operationExpiryDate', e.target.value)}
          required
        />

        <DatePicker
          label="Ngày hết hạn đăng kiểm"
          value={formData.inspectionExpiryDate}
          onChange={(e) => handleChange('inspectionExpiryDate', e.target.value)}
          required
        />

        <DatePicker
          label="Ngày hết hạn bảo hiểm"
          value={formData.insuranceExpiryDate}
          onChange={(e) => handleChange('insuranceExpiryDate', e.target.value)}
          required
        />

        {/* Current Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vị trí hiện tại
          </label>
          <input
            type="text"
            value={formData.currentLocation}
            onChange={(e) => handleChange('currentLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Bãi xe Bình Chánh"
          />
        </div>

      </form>
        {/* Actions */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 flex-shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" form="vehicle-form" disabled={isUploading}>
            {isUploading ? 'Đang tải ảnh lên...' : isEdit ? 'Cập nhật' : 'Thêm phương tiện'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
