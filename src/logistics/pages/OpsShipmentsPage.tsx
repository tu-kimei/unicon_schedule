import { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getAllShipments,
  getAvailableDrivers,
  getAvailableVehicles,
  createDriverTask,
  getDriverTasks,
} from 'wasp/client/operations';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/RoleGuard';

// --- Types ---
interface Shipment {
  id: string;
  shipmentNumber: string;
  shipmentType?: 'EXPORT' | 'IMPORT';
  operationStatus: string;
  documentStatus: string;
  plannedStartDate: string;
  containerNumber?: string;
  containerType?: string;
  customer?: { name: string };
  stops?: { sequence: number; locationName: string; stopType: string; stopCategory?: string }[];
  driverTasks?: {
    driver?: { fullName: string };
    tractor?: { licensePlate: string };
  }[];
}

interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: string;
  status: string;
}

interface DriverItem {
  id: string;
  fullName: string;
  status: string;
  user: { fullName: string };
  defaultTractor?: Vehicle | null;
  defaultTrailer?: Vehicle | null;
}

// --- Container type short labels ---
const containerTypeShort: Record<string, string> = {
  CONTAINER_20FT: "20'",
  CONTAINER_40FT: "40'",
  CONTAINER_40HC: "40'HC",
  CONTAINER_45FT: "45'",
  FLATBED: "Flatbed",
  TANK: "Tank",
  REFRIGERATED: "Lạnh",
  OPEN_TOP: "Open",
};

// --- Kanban column config ---
const COLUMNS = [
  {
    key: 'pending',
    title: 'Chờ điều phối',
    statuses: ['DRAFT', 'PENDING'],
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'dispatched',
    title: 'Đã điều phối',
    statuses: ['DISPATCHED', 'IN_TRANSIT'],
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-50',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'delivered',
    title: 'Đã giao',
    statuses: ['DELIVERED'],
    borderColor: 'border-green-400',
    bgColor: 'bg-green-50',
    badgeColor: 'bg-green-100 text-green-700',
  },
] as const;

// --- Helpers ---
function isSameDay(dateStr: string, target: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function formatViDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function groupByCustomer(shipments: Shipment[]): Record<string, Shipment[]> {
  const groups: Record<string, Shipment[]> = {};
  for (const s of shipments) {
    const name = s.customer?.name || 'Không rõ khách hàng';
    if (!groups[name]) groups[name] = [];
    groups[name].push(s);
  }
  return groups;
}

function getStopsLabel(shipment: Shipment): string {
  const stops = shipment.stops;
  if (!stops || stops.length === 0) return '';
  const names = stops
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => s.locationName)
    .filter((n) => n && n.trim());
  if (names.length === 0) return `${stops.length} điểm dừng`;
  return names.join(' \u2192 ');
}

// --- Skeleton ---
function ColumnSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-3 animate-pulse motion-reduce:animate-none">
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// --- Shipment Card ---
function ShipmentCard({
  shipment,
  columnKey,
  onAssign,
}: {
  shipment: Shipment;
  columnKey: string;
  onAssign?: () => void;
}) {
  const navigate = useNavigate();
  const driverTask = shipment.driverTasks?.[0];
  const driverName = driverTask?.driver?.fullName;
  const tractorPlate = driverTask?.tractor?.licensePlate;
  const contLabel = shipment.containerType ? containerTypeShort[shipment.containerType] : null;
  const stopsLabel = getStopsLabel(shipment);

  return (
    <div
      onClick={() => navigate(`/ops/shipments/${shipment.id}`)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 motion-reduce:transition-none"
    >
      {/* Row 1: shipment number + type badge + container type badge */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="text-sm font-semibold text-gray-900">
          {shipment.shipmentNumber}
        </span>
        {shipment.shipmentType && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              shipment.shipmentType === 'EXPORT'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {shipment.shipmentType === 'EXPORT' ? 'Xuất' : 'Nhập'}
          </span>
        )}
        {contLabel && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
            {contLabel}
          </span>
        )}
      </div>

      {/* Container number */}
      {shipment.containerNumber && (
        <p className="text-xs text-gray-500 mb-1">{shipment.containerNumber}</p>
      )}

      {/* Stop locations */}
      {stopsLabel && (
        <p className="text-xs text-gray-500 mb-1 truncate" title={stopsLabel}>
          {stopsLabel}
        </p>
      )}

      {/* Divider + driver info for dispatched column */}
      {columnKey === 'dispatched' && driverName && (
        <>
          <hr className="my-2 border-gray-100" />
          <p className="text-xs text-gray-600">
            🚛 {driverName}
            {tractorPlate ? ` (${tractorPlate})` : ''}
          </p>
        </>
      )}

      {/* Delivered column: delivery + document status */}
      {columnKey === 'delivered' && (
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          <span className="text-green-600">✓ Đã giao</span>
          {shipment.documentStatus === 'DOC_RETURNED' ? (
            <span className="text-green-600">✓ Đã trả CT</span>
          ) : (
            <span className="text-gray-400">⊘ Chờ chứng từ</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
        <Link
          to={`/ops/shipments/${shipment.id}`}
          onClick={(e) => e.stopPropagation()}
          className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
        >
          Xem
        </Link>
        {columnKey === 'pending' && onAssign && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            className="px-2.5 py-1 text-xs font-medium rounded bg-primary-600 hover:bg-primary-700 text-white cursor-pointer transition-colors duration-200"
          >
            Gán tài xế
          </button>
        )}
      </div>
    </div>
  );
}

// --- Empty state ---
function EmptyColumn({ columnKey }: { columnKey: string }) {
  const messages: Record<string, string> = {
    pending: 'Chưa có chuyến hàng nào chờ điều phối cho ngày này',
    dispatched: 'Chưa có chuyến hàng nào được điều phối cho ngày này',
    delivered: 'Chưa có chuyến hàng nào đã giao cho ngày này',
  };
  return (
    <div className="text-center py-8 px-4">
      <p className="text-sm text-gray-400">Không có chuyến hàng</p>
      <p className="text-xs text-gray-300 mt-1">
        {messages[columnKey] || ''}
      </p>
    </div>
  );
}

// --- Assign Driver Modal ---
function AssignDriverModal({
  shipment,
  onClose,
  onSuccess,
}: {
  shipment: Shipment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: availableDrivers } = useQuery(getAvailableDrivers);
  const { data: availableVehicles } = useQuery(getAvailableVehicles);
  const { data: allDriverTasks } = useQuery(getDriverTasks, {});

  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTractor, setSelectedTractor] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const drivers = (availableDrivers || []) as DriverItem[];
  const vehicles = (availableVehicles || []) as Vehicle[];
  const tractors = vehicles.filter((v) => v.vehicleType === 'TRACTOR');
  const trailers = vehicles.filter((v) => v.vehicleType === 'TRAILER');

  const handleDriverChange = (driverId: string) => {
    setSelectedDriver(driverId);
    if (driverId) {
      const driver = drivers.find((d) => d.id === driverId);
      setSelectedTractor(driver?.defaultTractor?.id || '');
      setSelectedTrailer(driver?.defaultTrailer?.id || '');
    } else {
      setSelectedTractor('');
      setSelectedTrailer('');
    }
  };

  const handleAssign = async () => {
    if (!selectedDriver || !selectedTractor) return;
    setIsAssigning(true);
    setErrorMsg('');
    try {
      // Calculate next sequence
      const driverTasks = ((allDriverTasks || []) as any[]).filter(
        (t: any) => t.driverId === selectedDriver,
      );
      const maxSeq = driverTasks.reduce(
        (max: number, t: any) => Math.max(max, t.sequence || 0),
        0,
      );

      await createDriverTask({
        shipmentId: shipment.id,
        driverId: selectedDriver,
        tractorId: selectedTractor,
        trailerId: selectedTrailer || undefined,
        sequence: maxSeq + 1,
        instructions: instructions || undefined,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Không thể phân công tài xế. Vui lòng thử lại.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Phân công tài xế</h2>
          <p className="text-sm text-gray-500 mt-1">
            {shipment.shipmentNumber} - {shipment.customer?.name || ''}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {errorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tài xế <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-200"
            >
              <option value="">-- Chọn tài xế --</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
                  {driver.defaultTractor ? ` - ${driver.defaultTractor.licensePlate}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle info */}
          {selectedDriver && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đầu kéo <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTractor}
                  onChange={(e) => setSelectedTractor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-200"
                >
                  <option value="">-- Chọn đầu kéo --</option>
                  {tractors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rơ moóc
                </label>
                <select
                  value={selectedTrailer}
                  onChange={(e) => setSelectedTrailer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-200"
                >
                  <option value="">-- Không chọn --</option>
                  {trailers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ghi chú
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm transition-colors duration-200"
              rows={2}
              placeholder="Ghi chú cho tài xế..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedTractor || isAssigning}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
          >
            {isAssigning ? 'Đang phân công...' : 'Phân công'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export const OpsShipmentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Assign modal state
  const [assignShipment, setAssignShipment] = useState<Shipment | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Date from URL or today
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  // Search from URL
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const { data: shipments, isLoading, error, refetch: refetchShipments } = useQuery(getAllShipments, {});

  // Update URL when date changes
  const changeDate = useCallback(
    (newDate: Date) => {
      setSelectedDate(newDate);
      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      setSearchParams((prev) => {
        prev.set('date', `${yyyy}-${mm}-${dd}`);
        return prev;
      });
    },
    [setSearchParams],
  );

  const goToday = useCallback(() => changeDate(new Date()), [changeDate]);
  const goPrev = useCallback(
    () => changeDate(addDays(selectedDate, -1)),
    [selectedDate, changeDate],
  );
  const goNext = useCallback(
    () => changeDate(addDays(selectedDate, 1)),
    [selectedDate, changeDate],
  );

  // Update search URL param
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setSearchParams((prev) => {
        if (value) prev.set('q', value);
        else prev.delete('q');
        return prev;
      });
    },
    [setSearchParams],
  );

  // Filter + group
  const columnData = useMemo(() => {
    if (!shipments) return null;

    const allShipments = shipments as Shipment[];

    // Filter by date
    const byDate = allShipments.filter((s) =>
      isSameDay(s.plannedStartDate, selectedDate),
    );

    // Filter by search
    const searchLower = search.toLowerCase().trim();
    const filtered = searchLower
      ? byDate.filter((s) => {
          const number = (s.shipmentNumber || '').toLowerCase();
          const customer = (s.customer?.name || '').toLowerCase();
          const container = (s.containerNumber || '').toLowerCase();
          return (
            number.includes(searchLower) ||
            customer.includes(searchLower) ||
            container.includes(searchLower)
          );
        })
      : byDate;

    // Split into columns
    return COLUMNS.map((col) => {
      const colShipments = filtered.filter((s) =>
        (col.statuses as readonly string[]).includes(s.operationStatus),
      );
      return {
        ...col,
        shipments: colShipments,
        grouped: groupByCustomer(colShipments),
        count: colShipments.length,
      };
    });
  }, [shipments, selectedDate, search]);

  const handleAssignSuccess = () => {
    setSuccessMessage('Phân công tài xế thành công!');
    setTimeout(() => setSuccessMessage(null), 4000);
    refetchShipments();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Lỗi khi tải chuyến hàng: {(error as Error).message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['OPS', 'ADMIN', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Header bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Date navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  aria-label="Ngày trước"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="text-sm font-heading font-semibold text-gray-900 min-w-[200px] text-center capitalize">
                  {formatViDate(selectedDate)}
                </span>

                <button
                  onClick={goNext}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  aria-label="Ngày sau"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={goToday}
                  className="ml-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  Hôm nay
                </button>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm mã chuyến, KH, số cont..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Create button */}
              <Link
                to="/ops/shipments/create"
                className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 transition-colors duration-200 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo chuyến
              </Link>
            </div>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 max-w-full mx-auto">
            {COLUMNS.map((col, colIdx) => {
              const data = columnData?.[colIdx];
              return (
                <div
                  key={col.key}
                  className={`flex flex-col rounded-xl border-t-4 ${col.borderColor} ${col.bgColor} min-h-0`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-700">
                      {col.title}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${col.badgeColor}`}
                    >
                      {data?.count ?? 0}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 md:max-h-[calc(100vh-200px)]">
                    {isLoading ? (
                      <ColumnSkeleton />
                    ) : !data || data.count === 0 ? (
                      <EmptyColumn columnKey={col.key} />
                    ) : (
                      Object.entries(data.grouped)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([customerName, customerShipments]) => (
                          <div key={customerName}>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                              {customerName}
                            </p>
                            <div className="space-y-2">
                              {customerShipments.map((shipment) => (
                                <ShipmentCard
                                  key={shipment.id}
                                  shipment={shipment}
                                  columnKey={col.key}
                                  onAssign={() => setAssignShipment(shipment)}
                                />
                              ))}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assign Driver Modal */}
        {assignShipment && (
          <AssignDriverModal
            shipment={assignShipment}
            onClose={() => setAssignShipment(null)}
            onSuccess={handleAssignSuccess}
          />
        )}
      </div>
    </RoleGuard>
  );
};
