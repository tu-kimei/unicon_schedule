import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getMyShipments } from 'wasp/client/operations';
import { Link } from 'react-router-dom';

const operationStatusLabels: Record<string, string> = {
  DRAFT: 'Nhap',
  PENDING: 'Cho xu ly',
  DISPATCHED: 'Da dispatch',
  IN_TRANSIT: 'Dang van chuyen',
  DELIVERED: 'Da giao',
  CANCELLED: 'Da huy',
};

const documentStatusLabels: Record<string, string> = {
  DOC_PENDING: 'Cho chung tu',
  DOC_RECEIVED: 'Da nhan CT',
  DOC_RETURNED: 'Da tra CT',
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

export const MyShipmentsPage = () => {
  const { data: shipments, isLoading } = useQuery(getMyShipments);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter shipments
  const filteredShipments = shipments?.filter((shipment: any) => {
    const matchesStatus = statusFilter === 'ALL' || shipment.currentStatus === statusFilter;
    const matchesType = typeFilter === 'ALL' || shipment.shipmentType === typeFilter;
    const matchesSearch = !searchTerm ||
      shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  }) || [];

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'NORMAL': return 'text-blue-600';
      case 'LOW': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Chuyen hang cua toi</h1>
            <Link
              to="/customer/shipments/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tao yeu cau
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tim kiem
              </label>
              <input
                type="text"
                placeholder="Ma chuyen hang hoac so container..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Shipment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loai chuyen
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Tat ca</option>
                <option value="EXPORT">EXPORT</option>
                <option value="IMPORT">IMPORT</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trang thai
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Tat ca</option>
                <option value="DRAFT">Nhap</option>
                <option value="READY">San sang</option>
                <option value="ASSIGNED">Da phan cong</option>
                <option value="IN_TRANSIT">Dang van chuyen</option>
                <option value="COMPLETED">Hoan thanh</option>
                <option value="CANCELLED">Da huy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Dang tai...</p>
          </div>
        ) : filteredShipments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredShipments.map((shipment: any) => (
              <Link
                key={shipment.id}
                to={`/customer/shipments/${shipment.id}`}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{shipment.shipmentNumber}</h3>
                      {shipment.shipmentType && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {shipment.shipmentType}
                        </span>
                      )}
                    </div>
                    {shipment.containerNumber && (
                      <p className="text-sm text-gray-600 mt-1">
                        Container: {shipment.containerNumber}
                        {shipment.containerType && ` (${shipment.containerType.replace('CONTAINER_', '').replace('_', ' ')})`}
                      </p>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      operationStatusStyles[shipment.operationStatus] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {operationStatusLabels[shipment.operationStatus] || shipment.operationStatus || shipment.currentStatus}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      documentStatusStyles[shipment.documentStatus] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {documentStatusLabels[shipment.documentStatus] || shipment.documentStatus || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Do uu tien</span>
                    <p className={`font-medium ${getPriorityClass(shipment.priority)}`}>
                      {shipment.priority === 'URGENT' ? 'Khan cap' :
                       shipment.priority === 'HIGH' ? 'Cao' :
                       shipment.priority === 'NORMAL' ? 'Binh thuong' : 'Thap'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Diem dung</span>
                    <p className="font-medium text-gray-900">{shipment.stops.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngay bat dau</span>
                    <p className="font-medium text-gray-900">
                      {new Date(shipment.plannedStartDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngay ket thuc</span>
                    <p className="font-medium text-gray-900">
                      {new Date(shipment.plannedEndDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* DriverTask info (instead of legacy dispatch) */}
                {shipment.driverTasks && shipment.driverTasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">Xe:</span>
                        <span className="font-medium text-gray-900">{shipment.driverTasks[0].tractor?.licensePlate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-600">Tai xe:</span>
                        <span className="font-medium text-gray-900">
                          {shipment.driverTasks[0].driver?.fullName || shipment.driverTasks[0].driver?.user?.fullName}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy dispatch info fallback */}
                {!shipment.driverTasks?.length && shipment.dispatch && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">Xe:</span>
                        <span className="font-medium text-gray-900">{shipment.dispatch.vehicle.licensePlate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-600">Tai xe:</span>
                        <span className="font-medium text-gray-900">{shipment.dispatch.driver.user.fullName}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 mb-2">Khong tim thay chuyen hang</p>
            <p className="text-sm text-gray-500">Thu dieu chinh bo loc hoac tao chuyen hang moi</p>
          </div>
        )}
      </div>
    </div>
  );
};
