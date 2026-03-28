import { useState } from 'react';
import { createShipmentRequest } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/RoleGuard';

type ShipmentType = 'EXPORT' | 'IMPORT';

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  stopCategory?: string;
  requiredPhotos?: string[];
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: Date;
  plannedDeparture: Date;
  specialInstructions?: string;
}

interface FormData {
  shipmentType?: ShipmentType;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  containerNumber: string;
  containerType: string;
  specialInstructions: string;
  stops: ShipmentStopInput[];
}

const STOP_TEMPLATES: Record<ShipmentType, Array<{ sequence: number; stopCategory: string; stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT'; requiredPhotos: string[]; label: string }>> = {
  EXPORT: [
    { sequence: 1, stopCategory: 'PICKUP_EMPTY', stopType: 'DEPOT', requiredPhotos: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'], label: 'Lấy container rỗng (Bãi)' },
    { sequence: 2, stopCategory: 'WAREHOUSE_LOAD', stopType: 'PICKUP', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'], label: 'Đóng hàng (Kho)' },
    { sequence: 3, stopCategory: 'PORT_DELIVERY', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'], label: 'Hạ cảng' },
  ],
  IMPORT: [
    { sequence: 1, stopCategory: 'PORT_PICKUP', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'], label: 'Lấy hàng tại cảng' },
    { sequence: 2, stopCategory: 'WAREHOUSE_UNLOAD', stopType: 'DROPOFF', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'], label: 'Dỡ hàng (Kho)' },
    { sequence: 3, stopCategory: 'RETURN_EMPTY', stopType: 'DEPOT', requiredPhotos: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'], label: 'Trả container rỗng (Bãi)' },
  ],
};

const photoCategoryLabels: Record<string, string> = {
  CONTAINER_EXTERIOR: 'Mặt ngoài container',
  CONTAINER_INTERIOR: 'Mặt trong container',
  PORT_GATE_PASS: 'Phiếu ra/vào cảng',
  WAREHOUSE_GATE_PASS: 'Phiếu ra/vào kho',
  WEIGHT_TICKET: 'Phiếu cân xe',
  OTHER: 'Khác',
};

const stopCategoryLabels: Record<string, string> = {
  PICKUP_EMPTY: 'Lấy container rỗng',
  WAREHOUSE_LOAD: 'Đóng hàng tại kho',
  PORT_DELIVERY: 'Giao tại cảng',
  PORT_PICKUP: 'Lấy hàng tại cảng',
  WAREHOUSE_UNLOAD: 'Dỡ hàng tại kho',
  RETURN_EMPTY: 'Trả container rỗng',
};

export const CreateShipmentRequestPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    shipmentType: undefined,
    priority: 'NORMAL',
    plannedStartDate: new Date(),
    plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    containerNumber: '',
    containerType: '',
    specialInstructions: '',
    stops: []
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleShipmentTypeChange = (type: ShipmentType) => {
    const templates = STOP_TEMPLATES[type];
    const stops: ShipmentStopInput[] = templates.map(t => ({
      sequence: t.sequence,
      stopType: t.stopType,
      stopCategory: t.stopCategory,
      requiredPhotos: t.requiredPhotos,
      locationName: '',
      address: '',
      plannedArrival: form.plannedStartDate,
      plannedDeparture: new Date(form.plannedStartDate.getTime() + 2 * 60 * 60 * 1000),
    }));
    updateForm({ shipmentType: type, stops });
  };

  const addStop = () => {
    const newSequence = form.stops.length + 1;
    const newStop: ShipmentStopInput = {
      sequence: newSequence,
      stopType: 'PICKUP',
      locationName: '',
      address: '',
      plannedArrival: form.plannedStartDate,
      plannedDeparture: new Date(form.plannedStartDate.getTime() + 2 * 60 * 60 * 1000)
    };
    updateForm({ stops: [...form.stops, newStop] });
  };

  const updateStop = (index: number, updates: Partial<ShipmentStopInput>) => {
    const updatedStops = [...form.stops];
    updatedStops[index] = { ...updatedStops[index], ...updates };
    updateForm({ stops: updatedStops });
  };

  const removeStop = (index: number) => {
    // Don't allow removing template stops when shipmentType is set
    if (form.shipmentType && index < 3) return;
    const updatedStops = form.stops.filter((_, i) => i !== index);
    const reSequencedStops = updatedStops.map((stop, i) => ({
      ...stop,
      sequence: i + 1
    }));
    updateForm({ stops: reSequencedStops });
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(form.plannedStartDate && form.plannedEndDate && form.plannedEndDate > form.plannedStartDate);
      case 2:
        return form.stops.length > 0 && form.stops.every(stop =>
          stop.locationName && stop.address && stop.plannedArrival && stop.plannedDeparture
        );
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const shipment = await createShipmentRequest({
        shipmentType: form.shipmentType,
        priority: form.priority,
        plannedStartDate: form.plannedStartDate,
        plannedEndDate: form.plannedEndDate,
        containerNumber: form.containerNumber || undefined,
        containerType: form.containerType || undefined,
        specialInstructions: form.specialInstructions || undefined,
        stops: form.stops
      });

      navigate(`/customer/shipments/${shipment.id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo yêu cầu vận chuyển');
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['Thông tin cơ bản', 'Điểm dừng', 'Xem lại'].map((label, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-primary-600 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            <span className={`ml-2 text-sm font-medium ${isActive ? 'text-primary-600' : 'text-gray-600'}`}>
              {label}
            </span>
            {index < 2 && <div className="w-16 h-0.5 bg-gray-300 mx-4" />}
          </div>
        );
      })}
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Shipment Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Loại chuyến hàng <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleShipmentTypeChange('EXPORT')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              form.shipmentType === 'EXPORT'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="font-semibold text-lg">Hàng xuất</span>
            <p className="text-xs mt-1 text-gray-500">Lấy rỗng - Đóng hàng - Hạ cảng</p>
          </button>

          <button
            type="button"
            onClick={() => handleShipmentTypeChange('IMPORT')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              form.shipmentType === 'IMPORT'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span className="font-semibold text-lg">Hàng nhập</span>
            <p className="text-xs mt-1 text-gray-500">Lấy hàng cảng - Dỡ kho - Trả rỗng</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Độ ưu tiên
          </label>
          <select
            value={form.priority}
            onChange={(e) => updateForm({ priority: e.target.value as any })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
          >
            <option value="LOW">Thấp</option>
            <option value="NORMAL">Bình thường</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại container
          </label>
          <select
            value={form.containerType}
            onChange={(e) => updateForm({ containerType: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Chọn loại --</option>
            <option value="CONTAINER_20FT">Container 20ft</option>
            <option value="CONTAINER_40FT">Container 40ft</option>
            <option value="CONTAINER_40HC">Container 40ft High Cube</option>
            <option value="CONTAINER_45FT">Container 45ft</option>
            <option value="FLATBED">Flatbed</option>
            <option value="TANK">Tank Container</option>
            <option value="REFRIGERATED">Container lạnh</option>
            <option value="OPEN_TOP">Open Top</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số container (Tùy chọn)
        </label>
        <input
          type="text"
          value={form.containerNumber}
          onChange={(e) => updateForm({ containerNumber: e.target.value })}
          placeholder="VD: CONT123456"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu dự kiến *
          </label>
          <input
            type="datetime-local"
            value={form.plannedStartDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedStartDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày kết thúc dự kiến *
          </label>
          <input
            type="datetime-local"
            value={form.plannedEndDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedEndDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hướng dẫn đặc biệt (Tùy chọn)
        </label>
        <textarea
          value={form.specialInstructions}
          onChange={(e) => updateForm({ specialInstructions: e.target.value })}
          placeholder="Các yêu cầu xử lý đặc biệt..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderStopsStep = () => (
    <div className="space-y-4">
      {form.shipmentType && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-primary-800">
            Chuyến {form.shipmentType}: Đã tạo sẵn {form.stops.length} điểm dừng theo quy trình.
            Vui lòng điền thông tin địa điểm cho từng điểm dừng.
          </p>
        </div>
      )}

      {form.stops.map((stop, index) => {
        const template = form.shipmentType
          ? STOP_TEMPLATES[form.shipmentType]?.find(t => t.sequence === stop.sequence)
          : undefined;
        const isTemplateStop = form.shipmentType && index < 3;

        return (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900">
                  Điểm dừng {stop.sequence}
                  {template && (
                    <span className="ml-2 text-sm text-primary-600 font-normal">
                      - {template.label}
                    </span>
                  )}
                </h3>
                {stop.stopCategory && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {stopCategoryLabels[stop.stopCategory] || stop.stopCategory}
                  </span>
                )}
              </div>
              {!isTemplateStop && (
                <button
                  onClick={() => removeStop(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Required Photos Info */}
            {stop.requiredPhotos && stop.requiredPhotos.length > 0 && (
              <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-xs font-medium text-amber-800 mb-1">Ảnh bắt buộc tại điểm này:</p>
                <div className="flex flex-wrap gap-1">
                  {stop.requiredPhotos.map((photo) => (
                    <span key={photo} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                      {photoCategoryLabels[photo] || photo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isTemplateStop && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại điểm dừng *
                  </label>
                  <select
                    value={stop.stopType}
                    onChange={(e) => updateStop(index, { stopType: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="PICKUP">Nơi lấy hàng</option>
                    <option value="DROPOFF">Nơi giao hàng</option>
                    <option value="DEPOT">Bãi</option>
                    <option value="PORT">Cảng</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên địa điểm *
                </label>
                <input
                  type="text"
                  value={stop.locationName}
                  onChange={(e) => updateStop(index, { locationName: e.target.value })}
                  placeholder="VD: Kho A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className={isTemplateStop ? 'md:col-span-1' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={stop.address}
                  onChange={(e) => updateStop(index, { address: e.target.value })}
                  placeholder="Địa chỉ đầy đủ"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người liên hệ
                </label>
                <input
                  type="text"
                  value={stop.contactPerson || ''}
                  onChange={(e) => updateStop(index, { contactPerson: e.target.value })}
                  placeholder="Tên người liên hệ"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={stop.contactPhone || ''}
                  onChange={(e) => updateStop(index, { contactPhone: e.target.value })}
                  placeholder="Số điện thoại"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian đến dự kiến *
                </label>
                <input
                  type="datetime-local"
                  value={stop.plannedArrival instanceof Date ? stop.plannedArrival.toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateStop(index, { plannedArrival: new Date(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian rời dự kiến *
                </label>
                <input
                  type="datetime-local"
                  value={stop.plannedDeparture instanceof Date ? stop.plannedDeparture.toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateStop(index, { plannedDeparture: new Date(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hướng dẫn đặc biệt
                </label>
                <textarea
                  value={stop.specialInstructions || ''}
                  onChange={(e) => updateStop(index, { specialInstructions: e.target.value })}
                  placeholder="Hướng dẫn đặc biệt cho điểm dừng này..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        );
      })}

      {!form.shipmentType && (
        <button
          onClick={addStop}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm điểm dừng
        </button>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Tóm tắt yêu cầu vận chuyển</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {form.shipmentType && (
            <div>
              <span className="font-medium text-primary-900">Loại:</span>
              <p className="text-primary-800">{form.shipmentType}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-primary-900">Độ ưu tiên:</span>
            <p className="text-primary-800">
              {form.priority === 'URGENT' ? 'Khẩn cấp' :
               form.priority === 'HIGH' ? 'Cao' :
               form.priority === 'NORMAL' ? 'Bình thường' : 'Thấp'}
            </p>
          </div>
          {form.containerNumber && (
            <div>
              <span className="font-medium text-primary-900">Số container:</span>
              <p className="text-primary-800">{form.containerNumber}</p>
            </div>
          )}
          {form.containerType && (
            <div>
              <span className="font-medium text-primary-900">Loại container:</span>
              <p className="text-primary-800">{form.containerType.replace('CONTAINER_', '').replace('_', ' ')}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-primary-900">Ngày bắt đầu:</span>
            <p className="text-primary-800">{form.plannedStartDate.toLocaleString('vi-VN')}</p>
          </div>
          <div>
            <span className="font-medium text-primary-900">Ngày kết thúc:</span>
            <p className="text-primary-800">{form.plannedEndDate.toLocaleString('vi-VN')}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-primary-900">Tổng số điểm dừng:</span>
            <p className="text-primary-800">{form.stops.length} điểm</p>
          </div>
          {form.specialInstructions && (
            <div className="col-span-2">
              <span className="font-medium text-primary-900">Hướng dẫn đặc biệt:</span>
              <p className="text-primary-800">{form.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Chi tiết điểm dừng:</h4>
        {form.stops.map((stop, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium text-gray-900">
                  Điểm dừng {stop.sequence}: {stop.locationName}
                </h5>
                <p className="text-sm text-gray-600">{stop.address}</p>
                <div className="flex gap-2 mt-1">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {stop.stopType}
                  </span>
                  {stop.stopCategory && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {stopCategoryLabels[stop.stopCategory] || stop.stopCategory}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{stop.plannedArrival.toLocaleString('vi-VN')}</p>
                <p className="text-xs">đến</p>
                <p>{stop.plannedDeparture.toLocaleString('vi-VN')}</p>
              </div>
            </div>
            {stop.contactPerson && (
              <p className="text-sm text-gray-600 mt-2">
                Liên hệ: {stop.contactPerson} {stop.contactPhone && `(${stop.contactPhone})`}
              </p>
            )}
            {stop.requiredPhotos && stop.requiredPhotos.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Ảnh bắt buộc: </span>
                {stop.requiredPhotos.map(p => (
                  <span key={p} className="inline-block ml-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                    {photoCategoryLabels[p] || p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={['CUSTOMER_OWNER', 'CUSTOMER_OPS', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-heading font-bold text-gray-900">Tạo yêu cầu vận chuyển</h1>
            <p className="text-gray-600 mt-1">Gửi yêu cầu vận chuyển mới để được xác nhận</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {renderStepIndicator()}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Step Content */}
            <div className="mb-8">
              {step === 1 && renderBasicInfoStep()}
              {step === 2 && renderStopsStep()}
              {step === 3 && renderReviewStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  if (step > 1) setStep((step - 1) as any);
                  else navigate('/customer/shipments');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                {step === 1 ? 'Hủy' : 'Quay lại'}
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep((step + 1) as any)}
                  disabled={!validateStep(step)}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 transition-colors duration-200 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Tiếp theo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gửi yêu cầu
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};
