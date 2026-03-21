import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllCustomers, createShipment } from 'wasp/client/operations';

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: Date;
  plannedDeparture: Date;
  specialInstructions?: string;
}

interface CreateShipmentForm {
  customerId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  stops: ShipmentStopInput[];
}

export const CreateShipmentPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CreateShipmentForm>({
    customerId: '',
    priority: 'NORMAL',
    plannedStartDate: new Date(),
    plannedEndDate: new Date(),
    stops: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active customers
  const { data: customers, isLoading } = useQuery(getAllCustomers);

  const updateForm = (updates: Partial<CreateShipmentForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const addStop = () => {
    const newSequence = form.stops.length + 1;
    const newStop: ShipmentStopInput = {
      sequence: newSequence,
      stopType: 'PICKUP',
      locationName: '',
      address: '',
      plannedArrival: new Date(),
      plannedDeparture: new Date()
    };
    updateForm({ stops: [...form.stops, newStop] });
  };

  const updateStop = (index: number, updates: Partial<ShipmentStopInput>) => {
    const updatedStops = [...form.stops];
    updatedStops[index] = { ...updatedStops[index], ...updates };
    updateForm({ stops: updatedStops });
  };

  const removeStop = (index: number) => {
    const updatedStops = form.stops.filter((_, i) => i !== index);
    // Re-sequence the stops
    const reSequencedStops = updatedStops.map((stop, i) => ({
      ...stop,
      sequence: i + 1
    }));
    updateForm({ stops: reSequencedStops });
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(form.customerId && form.plannedStartDate && form.plannedEndDate &&
                 form.plannedEndDate > form.plannedStartDate);
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
    try {
      await createShipment(form);
      // Redirect to shipments list or show success
      console.log('Shipment created successfully');
      // You can use Wasp's navigation here
    } catch (error) {
      console.error('Failed to create shipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center mb-8">
      {['Thông tin cơ bản', 'Điểm dừng', 'Xác nhận'].map((label, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            <span className={`ml-2 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
              {label}
            </span>
            {index < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
          </div>
        );
      })}
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Khách hàng *
        </label>
        <select
          value={form.customerId}
          onChange={(e) => updateForm({ customerId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">-- Chọn khách hàng --</option>
          {customers?.filter((c: Customer) => c.status === 'ACTIVE').map((customer: Customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Chọn khách hàng cho chuyến hàng này
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mức ưu tiên
        </label>
        <select
          value={form.priority}
          onChange={(e) => updateForm({ priority: e.target.value as any })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="LOW">Thấp</option>
          <option value="NORMAL">Bình thường</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu dự kiến
          </label>
          <input
            type="datetime-local"
            value={form.plannedStartDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedStartDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày kết thúc dự kiến
          </label>
          <input
            type="datetime-local"
            value={form.plannedEndDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedEndDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  const renderStopsStep = () => (
    <div className="space-y-4">
      {form.stops.map((stop, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Điểm dừng {stop.sequence}</h3>
            <button
              onClick={() => removeStop(index)}
              className="text-red-500 hover:text-red-700"
            >
              Xóa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại điểm dừng
              </label>
              <select
                value={stop.stopType}
                onChange={(e) => updateStop(index, { stopType: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="PICKUP">Lấy hàng</option>
                <option value="DROPOFF">Giao hàng</option>
                <option value="DEPOT">Bãi xe</option>
                <option value="PORT">Cảng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên địa điểm
              </label>
              <input
                type="text"
                value={stop.locationName}
                onChange={(e) => updateStop(index, { locationName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Kho A"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={stop.address}
                onChange={(e) => updateStop(index, { address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Nguyễn Văn A"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0901 234 567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian đến dự kiến
              </label>
              <input
                type="datetime-local"
                value={stop.plannedArrival.toISOString().slice(0, 16)}
                onChange={(e) => updateStop(index, { plannedArrival: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian đi dự kiến
              </label>
              <input
                type="datetime-local"
                value={stop.plannedDeparture.toISOString().slice(0, 16)}
                onChange={(e) => updateStop(index, { plannedDeparture: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hướng dẫn đặc biệt
              </label>
              <textarea
                value={stop.specialInstructions || ''}
                onChange={(e) => updateStop(index, { specialInstructions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder="Hướng dẫn xử lý đặc biệt..."
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addStop}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
      >
        + Thêm điểm dừng
      </button>
    </div>
  );

  const renderReviewStep = () => {
    const selectedCustomer = customers?.find((c: Customer) => c.id === form.customerId);

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Tóm tắt chuyến hàng</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Khách hàng:</span>
              <p className="text-gray-900">{selectedCustomer?.name}</p>
              <p className="text-gray-600 text-xs">{selectedCustomer?.email}</p>
            </div>
            <div>
              <span className="font-medium">Mức ưu tiên:</span>
              <p className="text-gray-900">{form.priority}</p>
            </div>
            <div>
              <span className="font-medium">Ngày bắt đầu:</span>
              <p className="text-gray-900">{form.plannedStartDate.toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium">Ngày kết thúc:</span>
              <p className="text-gray-900">{form.plannedEndDate.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Tổng điểm dừng:</span>
              <p className="text-gray-900">{form.stops.length} điểm</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Chi tiết điểm dừng:</h4>
          {form.stops.map((stop, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">Điểm {stop.sequence}: {stop.locationName}</h5>
                  <p className="text-sm text-gray-600">{stop.address}</p>
                  <p className="text-sm text-gray-600">{stop.stopType}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{stop.plannedArrival.toLocaleString()}</p>
                  <p>to</p>
                  <p>{stop.plannedDeparture.toLocaleString()}</p>
                </div>
              </div>
              {stop.contactPerson && (
                <p className="text-sm mt-2">
                  Liên hệ: {stop.contactPerson} {stop.contactPhone && `(${stop.contactPhone})`}
                </p>
              )}
              {stop.specialInstructions && (
                <p className="text-sm mt-1 text-gray-600">
                  Hướng dẫn: {stop.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Tạo chuyến hàng mới</h1>
            <p className="text-gray-600">Điền thông tin chuyến hàng theo từng bước</p>
          </div>

          <div className="px-6 py-6">
            {renderStepIndicator()}

            <div className="mb-8">
              {step === 1 && renderBasicInfoStep()}
              {step === 2 && renderStopsStep()}
              {step === 3 && renderReviewStep()}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                disabled={step === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quay lại
              </button>

              <div className="flex space-x-3">
                {step < 3 ? (
                  <button
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    disabled={!validateStep(step)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp theo
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang tạo...' : 'Tạo chuyến hàng'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
