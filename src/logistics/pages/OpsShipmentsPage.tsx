import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllShipments } from 'wasp/client/operations';
import { ShipmentCard } from '../components/ShipmentCard';
import { Link } from 'react-router-dom';

interface ShipmentFilters {
  status?: string;
  priority?: string;
  shipmentType?: string;
  operationStatus?: string;
  dateRange?: { start?: Date; end?: Date };
}

const operationStatusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xử lý',
  DISPATCHED: 'Đã điều phối',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const documentStatusLabels: Record<string, string> = {
  DOC_PENDING: 'Chờ chứng từ',
  DOC_RECEIVED: 'Đã nhận chứng từ',
  DOC_RETURNED: 'Đã trả chứng từ',
};

const financialStatusLabels: Record<string, string> = {
  NOT_BILLED: 'Chưa xuất hóa đơn',
  INVOICED: 'Đã xuất hóa đơn',
  PARTIAL_PAID: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
};

const operationStatusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const documentStatusStyles: Record<string, string> = {
  DOC_PENDING: 'bg-orange-100 text-orange-700',
  DOC_RECEIVED: 'bg-blue-100 text-blue-700',
  DOC_RETURNED: 'bg-green-100 text-green-700',
};

const financialStatusStyles: Record<string, string> = {
  NOT_BILLED: 'bg-gray-100 text-gray-700',
  INVOICED: 'bg-blue-100 text-blue-700',
  PARTIAL_PAID: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

export const OpsShipmentsPage = () => {
  const [filters, setFilters] = useState<ShipmentFilters>({});

  const { data: shipments, isLoading, error } = useQuery(getAllShipments, filters);

  // Client-side filtering for shipmentType and operationStatus
  const filteredShipments = (shipments || []).filter((s: any) => {
    if (filters.shipmentType && s.shipmentType !== filters.shipmentType) return false;
    if (filters.operationStatus && s.operationStatus !== filters.operationStatus) return false;
    return true;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi khi tải chuyến hàng: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">Quản lý chuyến hàng</h1>
              <p className="text-gray-600">Tất cả chuyến hàng</p>
            </div>
            <Link
              to="/ops/shipments/create"
              className="bg-primary-600 hover:bg-primary-700 transition-colors duration-200 text-white px-4 py-2 rounded-lg font-medium"
            >
              Tạo chuyến hàng
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Shipment Type Filter */}
            <select
              value={filters.shipmentType || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                shipmentType: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả loại</option>
              <option value="EXPORT">Hàng xuất</option>
              <option value="IMPORT">Hàng nhập</option>
            </select>

            {/* Operation Status Filter */}
            <select
              value={filters.operationStatus || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                operationStatus: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả trạng thái VH</option>
              <option value="DRAFT">Nháp</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="DISPATCHED">Đã điều phối</option>
              <option value="IN_TRANSIT">Đang vận chuyển</option>
              <option value="DELIVERED">Đã giao</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                status: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="READY">Sẵn sàng</option>
              <option value="ASSIGNED">Đã gán</option>
              <option value="IN_TRANSIT">Đang vận chuyển</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priority: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả mức ưu tiên</option>
              <option value="LOW">Thấp</option>
              <option value="NORMAL">Bình thường</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>

            <input
              type="date"
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value) : undefined;
                setFilters(prev => ({
                  ...prev,
                  dateRange: start ? { ...prev.dateRange, start } : undefined
                }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Ngày bắt đầu"
            />
          </div>
        </div>

        {/* Shipments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredShipments.length > 0 ? (
            filteredShipments.map((shipment: any) => (
              <Link
                key={shipment.id}
                to={`/ops/shipments/${shipment.id}`}
                className="block cursor-pointer"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shipment.shipmentNumber}
                        </h3>
                        {shipment.shipmentType && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {shipment.shipmentType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {shipment.customer?.name}
                      </p>
                    </div>
                  </div>

                  {/* 3 Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      operationStatusStyles[shipment.operationStatus] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {operationStatusLabels[shipment.operationStatus] || shipment.operationStatus || 'N/A'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      documentStatusStyles[shipment.documentStatus] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {documentStatusLabels[shipment.documentStatus] || shipment.documentStatus || 'N/A'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      financialStatusStyles[shipment.financialStatus] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {financialStatusLabels[shipment.financialStatus] || shipment.financialStatus || 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mức ưu tiên:</span>
                      <span className={`font-medium ${
                        shipment.priority === 'URGENT' ? 'text-red-600' :
                        shipment.priority === 'HIGH' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {shipment.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Điểm dừng:</span>
                      <span className="font-medium">{shipment.stops?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bắt đầu:</span>
                      <span className="font-medium">
                        {new Date(shipment.plannedStartDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">Không tìm thấy chuyến hàng</p>
              <p className="text-gray-400">Thử điều chỉnh bộ lọc hoặc tạo chuyến hàng mới</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
