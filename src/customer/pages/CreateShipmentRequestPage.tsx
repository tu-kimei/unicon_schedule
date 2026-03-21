import { useState } from 'react';
import { createShipmentRequest } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';

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
    { sequence: 1, stopCategory: 'PICKUP_EMPTY', stopType: 'DEPOT', requiredPhotos: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'], label: 'Lay container rong (Bai)' },
    { sequence: 2, stopCategory: 'WAREHOUSE_LOAD', stopType: 'PICKUP', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'], label: 'Dong hang (Kho)' },
    { sequence: 3, stopCategory: 'PORT_DELIVERY', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'], label: 'Ha cang' },
  ],
  IMPORT: [
    { sequence: 1, stopCategory: 'PORT_PICKUP', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'], label: 'Lay hang tai cang' },
    { sequence: 2, stopCategory: 'WAREHOUSE_UNLOAD', stopType: 'DROPOFF', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'], label: 'Do hang (Kho)' },
    { sequence: 3, stopCategory: 'RETURN_EMPTY', stopType: 'DEPOT', requiredPhotos: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'], label: 'Tra container rong (Bai)' },
  ],
};

const photoCategoryLabels: Record<string, string> = {
  CONTAINER_EXTERIOR: 'Anh ngoai container',
  CONTAINER_INTERIOR: 'Anh trong container',
  PORT_GATE_PASS: 'Phieu qua cong cang',
  WAREHOUSE_GATE_PASS: 'Phieu qua cong kho',
  WEIGHT_TICKET: 'Phieu can',
  OTHER: 'Khac',
};

const stopCategoryLabels: Record<string, string> = {
  PICKUP_EMPTY: 'Lay container rong',
  WAREHOUSE_LOAD: 'Dong hang tai kho',
  PORT_DELIVERY: 'Ha container tai cang',
  PORT_PICKUP: 'Lay hang tai cang',
  WAREHOUSE_UNLOAD: 'Do hang tai kho',
  RETURN_EMPTY: 'Tra container rong',
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
      setError(err.message || 'Failed to create shipment request');
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['Thong tin co ban', 'Diem dung', 'Xem lai'].map((label, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            <span className={`ml-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
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
          Loai chuyen hang <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleShipmentTypeChange('EXPORT')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              form.shipmentType === 'EXPORT'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="font-semibold text-lg">EXPORT</span>
            <p className="text-xs mt-1 text-gray-500">Lay rong - Dong hang - Ha cang</p>
          </button>

          <button
            type="button"
            onClick={() => handleShipmentTypeChange('IMPORT')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              form.shipmentType === 'IMPORT'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span className="font-semibold text-lg">IMPORT</span>
            <p className="text-xs mt-1 text-gray-500">Lay hang cang - Do kho - Tra rong</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do uu tien
          </label>
          <select
            value={form.priority}
            onChange={(e) => updateForm({ priority: e.target.value as any })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Thap</option>
            <option value="NORMAL">Binh thuong</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khan cap</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loai container
          </label>
          <select
            value={form.containerType}
            onChange={(e) => updateForm({ containerType: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chon loai --</option>
            <option value="CONTAINER_20FT">Container 20ft</option>
            <option value="CONTAINER_40FT">Container 40ft</option>
            <option value="CONTAINER_40HC">Container 40ft High Cube</option>
            <option value="CONTAINER_45FT">Container 45ft</option>
            <option value="FLATBED">Flatbed</option>
            <option value="TANK">Tank Container</option>
            <option value="REFRIGERATED">Container lanh</option>
            <option value="OPEN_TOP">Open Top</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          So container (Tuy chon)
        </label>
        <input
          type="text"
          value={form.containerNumber}
          onChange={(e) => updateForm({ containerNumber: e.target.value })}
          placeholder="VD: CONT123456"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngay bat dau du kien *
          </label>
          <input
            type="datetime-local"
            value={form.plannedStartDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedStartDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngay ket thuc du kien *
          </label>
          <input
            type="datetime-local"
            value={form.plannedEndDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedEndDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Yeu cau dac biet (Tuy chon)
        </label>
        <textarea
          value={form.specialInstructions}
          onChange={(e) => updateForm({ specialInstructions: e.target.value })}
          placeholder="Cac yeu cau xu ly dac biet..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStopsStep = () => (
    <div className="space-y-4">
      {form.shipmentType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            Chuyen {form.shipmentType}: Da tao san {form.stops.length} diem dung theo quy trinh.
            Vui long dien thong tin dia diem cho tung diem dung.
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
                  Diem dung {stop.sequence}
                  {template && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
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
                  Xoa
                </button>
              )}
            </div>

            {/* Required Photos Info */}
            {stop.requiredPhotos && stop.requiredPhotos.length > 0 && (
              <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-xs font-medium text-amber-800 mb-1">Anh bat buoc tai diem nay:</p>
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
                    Loai diem dung *
                  </label>
                  <select
                    value={stop.stopType}
                    onChange={(e) => updateStop(index, { stopType: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="PICKUP">Noi lay hang</option>
                    <option value="DROPOFF">Noi giao hang</option>
                    <option value="DEPOT">Bai</option>
                    <option value="PORT">Cang</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ten dia diem *
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
                  Dia chi *
                </label>
                <input
                  type="text"
                  value={stop.address}
                  onChange={(e) => updateStop(index, { address: e.target.value })}
                  placeholder="Dia chi day du"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nguoi lien he
                </label>
                <input
                  type="text"
                  value={stop.contactPerson || ''}
                  onChange={(e) => updateStop(index, { contactPerson: e.target.value })}
                  placeholder="Ten nguoi lien he"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  So dien thoai
                </label>
                <input
                  type="tel"
                  value={stop.contactPhone || ''}
                  onChange={(e) => updateStop(index, { contactPhone: e.target.value })}
                  placeholder="So dien thoai"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thoi gian den du kien *
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
                  Thoi gian roi du kien *
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
                  Yeu cau dac biet
                </label>
                <textarea
                  value={stop.specialInstructions || ''}
                  onChange={(e) => updateStop(index, { specialInstructions: e.target.value })}
                  placeholder="Yeu cau dac biet cho diem dung nay..."
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
          Them diem dung
        </button>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Tom tat yeu cau van chuyen</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {form.shipmentType && (
            <div>
              <span className="font-medium text-blue-900">Loai:</span>
              <p className="text-blue-800">{form.shipmentType}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-blue-900">Do uu tien:</span>
            <p className="text-blue-800">
              {form.priority === 'URGENT' ? 'Khan cap' :
               form.priority === 'HIGH' ? 'Cao' :
               form.priority === 'NORMAL' ? 'Binh thuong' : 'Thap'}
            </p>
          </div>
          {form.containerNumber && (
            <div>
              <span className="font-medium text-blue-900">So container:</span>
              <p className="text-blue-800">{form.containerNumber}</p>
            </div>
          )}
          {form.containerType && (
            <div>
              <span className="font-medium text-blue-900">Loai container:</span>
              <p className="text-blue-800">{form.containerType.replace('CONTAINER_', '').replace('_', ' ')}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-blue-900">Ngay bat dau:</span>
            <p className="text-blue-800">{form.plannedStartDate.toLocaleString('vi-VN')}</p>
          </div>
          <div>
            <span className="font-medium text-blue-900">Ngay ket thuc:</span>
            <p className="text-blue-800">{form.plannedEndDate.toLocaleString('vi-VN')}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-blue-900">Tong so diem dung:</span>
            <p className="text-blue-800">{form.stops.length} diem</p>
          </div>
          {form.specialInstructions && (
            <div className="col-span-2">
              <span className="font-medium text-blue-900">Yeu cau dac biet:</span>
              <p className="text-blue-800">{form.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Chi tiet diem dung:</h4>
        {form.stops.map((stop, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium text-gray-900">
                  Stop {stop.sequence}: {stop.locationName}
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
                <p className="text-xs">den</p>
                <p>{stop.plannedDeparture.toLocaleString('vi-VN')}</p>
              </div>
            </div>
            {stop.contactPerson && (
              <p className="text-sm text-gray-600 mt-2">
                Lien he: {stop.contactPerson} {stop.contactPhone && `(${stop.contactPhone})`}
              </p>
            )}
            {stop.requiredPhotos && stop.requiredPhotos.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Anh bat buoc: </span>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Tao yeu cau van chuyen</h1>
          <p className="text-gray-600 mt-1">Gui yeu cau van chuyen moi de duoc xac nhan</p>
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
              {step === 1 ? 'Huy' : 'Quay lai'}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                disabled={!validateStep(step)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Tiep theo
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
                    Dang gui...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Gui yeu cau
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
