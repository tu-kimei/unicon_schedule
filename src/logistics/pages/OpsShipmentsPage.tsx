import { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllShipments } from 'wasp/client/operations';
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
  customer?: { name: string };
  driverTasks?: {
    driver?: { fullName: string };
    tractor?: { licensePlate: string };
  }[];
}

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
}: {
  shipment: Shipment;
  columnKey: string;
}) {
  const navigate = useNavigate();
  const driverTask = shipment.driverTasks?.[0];
  const driverName = driverTask?.driver?.fullName;
  const tractorPlate = driverTask?.tractor?.licensePlate;

  return (
    <div
      onClick={() => navigate(`/ops/shipments/${shipment.id}`)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 motion-reduce:transition-none"
    >
      {/* Row 1: shipment number + type badge */}
      <div className="flex items-center justify-between mb-1">
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
      </div>

      {/* Container number */}
      {shipment.containerNumber && (
        <p className="text-xs text-gray-500 mb-1">{shipment.containerNumber}</p>
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

// --- Main Page ---
export const OpsShipmentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const { data: shipments, isLoading, error } = useQuery(getAllShipments, {});

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
      </div>
    </RoleGuard>
  );
};
