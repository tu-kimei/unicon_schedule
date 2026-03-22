import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllCustomers, createShipment } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/RoleGuard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
}

type ShipmentType = 'EXPORT' | 'IMPORT';

interface StopFormData {
  sequence: number;
  stopType: string;
  stopCategory: string;
  requiredPhotos: string[];
  label: string;
  locationName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  notes: string;
  expanded: boolean; // UI-only: controls "Thêm thông tin" accordion
}

interface FormErrors {
  shipmentType?: string;
  customerId?: string;
  plannedDate?: string;
  stops?: Record<number, { locationName?: string; address?: string }>;
}

// ─── Stop Templates ──────────────────────────────────────────────────────────

const STOP_TEMPLATES = {
  EXPORT: [
    { sequence: 1, stopCategory: 'PICKUP_EMPTY', stopType: 'DEPOT', label: 'Lấy container rỗng', requiredPhotos: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_LOAD', stopType: 'PICKUP', label: 'Đóng hàng tại kho', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'PORT_DELIVERY', stopType: 'PORT', label: 'Giao tại cảng', requiredPhotos: ['PORT_GATE_PASS'] },
  ],
  IMPORT: [
    { sequence: 1, stopCategory: 'PORT_PICKUP', stopType: 'PORT', label: 'Lấy hàng tại cảng', requiredPhotos: ['PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_UNLOAD', stopType: 'DROPOFF', label: 'Dỡ hàng tại kho', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'RETURN_EMPTY', stopType: 'DEPOT', label: 'Trả container rỗng', requiredPhotos: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'] },
  ],
};

const STOP_ICONS: Record<string, string> = {
  PICKUP_EMPTY: '\u2460',
  WAREHOUSE_LOAD: '\u2461',
  PORT_DELIVERY: '\u2462',
  PORT_PICKUP: '\u2460',
  WAREHOUSE_UNLOAD: '\u2461',
  RETURN_EMPTY: '\u2462',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStopsFromTemplate(type: ShipmentType): StopFormData[] {
  return STOP_TEMPLATES[type].map((t) => ({
    ...t,
    locationName: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    notes: '',
    expanded: false,
  }));
}

function todayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const CreateShipmentPage = () => {
  const navigate = useNavigate();
  const { data: customers, isLoading: customersLoading } = useQuery(getAllCustomers);

  // Form state
  const [shipmentType, setShipmentType] = useState<ShipmentType | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [plannedDate, setPlannedDate] = useState(todayDateString());
  const [containerNumber, setContainerNumber] = useState('');
  const [containerType, setContainerType] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [stops, setStops] = useState<StopFormData[]>([]);

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-generate stops when shipment type changes
  useEffect(() => {
    if (shipmentType) {
      setStops(buildStopsFromTemplate(shipmentType));
    } else {
      setStops([]);
    }
  }, [shipmentType]);

  // ─── Stop updates ────────────────────────────────────────────────────────

  const updateStop = (index: number, updates: Partial<StopFormData>) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const toggleStopExpanded = (index: number) => {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, expanded: !s.expanded } : s)),
    );
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!shipmentType) errs.shipmentType = 'Vui lòng chọn loại vận chuyển';
    if (!customerId) errs.customerId = 'Vui lòng chọn khách hàng';
    if (!plannedDate) errs.plannedDate = 'Vui lòng chọn ngày';

    const stopErrors: Record<number, { locationName?: string; address?: string }> = {};
    stops.forEach((stop, i) => {
      const se: { locationName?: string; address?: string } = {};
      if (!stop.locationName.trim()) se.locationName = 'Vui lòng nhập tên địa điểm';
      if (se.locationName || se.address) stopErrors[i] = se;
    });
    if (Object.keys(stopErrors).length > 0) errs.stops = stopErrors;

    return errs;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({ shipmentType: true, customerId: true, plannedDate: true, stops: true });

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const startOfDay = new Date(plannedDate + 'T00:00:00');
      const endOfDay = new Date(plannedDate + 'T23:59:59');

      await createShipment({
        customerId,
        shipmentType: shipmentType!,
        priority: priority as any,
        plannedStartDate: startOfDay,
        plannedEndDate: endOfDay,
        ...(containerNumber ? { containerNumber } : {}),
        ...(containerType ? { containerType } : {}),
        ...(specialInstructions ? { specialInstructions } : {}),
        stops: stops.map((s) => ({
          sequence: s.sequence,
          stopType: s.stopType as any,
          stopCategory: s.stopCategory,
          requiredPhotos: s.requiredPhotos,
          locationName: s.locationName.trim(),
          address: s.address.trim(),
          ...(s.contactPerson ? { contactPerson: s.contactPerson.trim() } : {}),
          ...(s.contactPhone ? { contactPhone: s.contactPhone.trim() } : {}),
          plannedArrival: startOfDay,
          plannedDeparture: endOfDay,
        })),
      });

      // Navigate with success state
      navigate('/ops/shipments', { state: { toast: 'Tạo chuyến hàng thành công!' } });
    } catch (error: any) {
      setSubmitError(
        error?.message || 'Không thể tạo chuyến hàng. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const fieldError = (field: string) =>
    touched[field] ? (errors as any)[field] : undefined;

  const activeCustomers = customers?.filter((c: Customer) => c.status === 'ACTIVE') ?? [];

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <RoleGuard allowedRoles={['OPS', 'ADMIN', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Tạo chuyến hàng mới
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Điền thông tin bên dưới để tạo chuyến hàng
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          {/* ── Section 1: Thông tin cơ bản ───────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              Thông tin cơ bản
            </h2>

            {/* Loại vận chuyển */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại vận chuyển <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['EXPORT', 'IMPORT'] as const).map((type) => {
                  const isSelected = shipmentType === type;
                  const config = {
                    EXPORT: { title: 'Hàng xuất', desc: 'Xuất khẩu container ra cảng', icon: '\uD83D\uDEA2' },
                    IMPORT: { title: 'Hàng nhập', desc: 'Nhập khẩu container từ cảng', icon: '\uD83D\uDCE6' },
                  };
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setShipmentType(type);
                        setTouched((p) => ({ ...p, shipmentType: true }));
                      }}
                      className={`cursor-pointer relative flex flex-col items-start p-4 rounded-lg border-2 transition-colors duration-200 text-left ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl mb-1">{config[type].icon}</span>
                      <span className="font-medium text-gray-900">{config[type].title}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{config[type].desc}</span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {fieldError('shipmentType') && (
                <p className="mt-1.5 text-sm text-red-600">{fieldError('shipmentType')}</p>
              )}
            </div>

            {/* Khách hàng */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              {customersLoading ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setTouched((p) => ({ ...p, customerId: true }));
                  }}
                  className="cursor-pointer w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {activeCustomers.map((c: Customer) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
              {fieldError('customerId') && (
                <p className="mt-1 text-sm text-red-600">{fieldError('customerId')}</p>
              )}
            </div>

            {/* Ngày */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => {
                  setPlannedDate(e.target.value);
                  setTouched((p) => ({ ...p, plannedDate: true }));
                }}
                className="cursor-pointer w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
              {fieldError('plannedDate') && (
                <p className="mt-1 text-sm text-red-600">{fieldError('plannedDate')}</p>
              )}
            </div>

            {/* Container info + Priority – optional row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số container
                </label>
                <input
                  type="text"
                  value={containerNumber}
                  onChange={(e) => setContainerNumber(e.target.value)}
                  placeholder="VD: MSKU1234567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loại container
                </label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="cursor-pointer w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                >
                  <option value="">-- Chọn --</option>
                  <option value="CONTAINER_20FT">Container 20ft</option>
                  <option value="CONTAINER_40FT">Container 40ft</option>
                  <option value="CONTAINER_40HC">Container 40ft HC</option>
                  <option value="CONTAINER_45FT">Container 45ft</option>
                  <option value="FLATBED">Flatbed</option>
                  <option value="TANK">Tank</option>
                  <option value="REFRIGERATED">Đông lạnh</option>
                  <option value="OPEN_TOP">Open Top</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mức ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="cursor-pointer w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                >
                  <option value="LOW">Thấp</option>
                  <option value="NORMAL">Bình thường</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── Section 2: Điểm dừng ──────────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Điểm dừng
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {shipmentType
                ? `${stops.length} điểm dừng tự động theo lộ trình ${shipmentType === 'EXPORT' ? 'hàng xuất' : 'hàng nhập'}`
                : 'Chọn loại vận chuyển ở trên để tạo điểm dừng tự động'}
            </p>

            {!shipmentType && (
              <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="mx-auto h-10 w-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm">Chọn loại vận chuyển để hiển thị lộ trình</p>
              </div>
            )}

            {stops.map((stop, index) => (
              <div
                key={`${shipmentType}-${stop.sequence}`}
                className="mb-4 last:mb-0 border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Stop header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {STOP_ICONS[stop.stopCategory] || stop.sequence}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">{stop.label}</span>
                    <span className="ml-2 text-xs text-gray-400 uppercase">{stop.stopCategory}</span>
                  </div>
                </div>

                {/* Required fields */}
                <div className="px-4 py-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên địa điểm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stop.locationName}
                        onChange={(e) => updateStop(index, { locationName: e.target.value })}
                        onBlur={() => setTouched((p) => ({ ...p, stops: true }))}
                        placeholder="VD: Cảng Cát Lái"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                      />
                      {touched.stops && errors.stops?.[index]?.locationName && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.stops[index].locationName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        value={stop.address}
                        onChange={(e) => updateStop(index, { address: e.target.value })}
                        onBlur={() => setTouched((p) => ({ ...p, stops: true }))}
                        placeholder="VD: Đường Nguyễn Thị Định, Q.2, TP.HCM"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                      />
                      {touched.stops && errors.stops?.[index]?.address && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.stops[index].address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional fields accordion */}
                  <button
                    type="button"
                    onClick={() => toggleStopExpanded(index)}
                    className="cursor-pointer flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${stop.expanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {stop.expanded ? 'Ẩn thông tin thêm' : 'Thêm thông tin'}
                  </button>

                  {stop.expanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Người liên hệ
                        </label>
                        <input
                          type="text"
                          value={stop.contactPerson}
                          onChange={(e) => updateStop(index, { contactPerson: e.target.value })}
                          placeholder="Nguyễn Văn A"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={stop.contactPhone}
                          onChange={(e) => updateStop(index, { contactPhone: e.target.value })}
                          placeholder="0901 234 567"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú điểm dừng
                        </label>
                        <textarea
                          value={stop.notes}
                          onChange={(e) => updateStop(index, { notes: e.target.value })}
                          rows={2}
                          placeholder="Hướng dẫn đặc biệt cho điểm dừng này..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* ── Section 3: Ghi chú ────────────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Ghi chú
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Yêu cầu đặc biệt
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                placeholder="Nhập yêu cầu đặc biệt cho chuyến hàng (nếu có)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>
          </section>
        </div>

        {/* ── Sticky Footer ─────────────────────────────────────────── */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
            {/* Error banner */}
            {submitError && (
              <div className="mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Validation hints after failed submit */}
            {Object.keys(errors).length > 0 && touched.shipmentType && (
              <div className="mb-2 text-xs text-red-500">
                {errors.shipmentType && <span className="mr-3">{errors.shipmentType}</span>}
                {errors.customerId && <span className="mr-3">{errors.customerId}</span>}
                {errors.plannedDate && <span className="mr-3">{errors.plannedDate}</span>}
                {errors.stops && (
                  <span>Vui lòng điền đầy đủ thông tin các điểm dừng</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/ops/shipments')}
                className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="cursor-pointer px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tạo...
                  </span>
                ) : (
                  'Tạo chuyến hàng'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};
