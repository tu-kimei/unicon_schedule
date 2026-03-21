import { useQuery } from 'wasp/client/operations';
import { getMyShipmentDetails, confirmDocuments } from 'wasp/client/operations';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';

export const MyShipmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: shipment, isLoading, refetch } = useQuery(getMyShipmentDetails, { id: id! });
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmDocuments = async () => {
    if (!confirm('Xác nhận rằng bạn đã nhận đủ tất cả chứng từ cho chuyến hàng này?')) {
      return;
    }

    setIsConfirming(true);
    try {
      await confirmDocuments({ shipmentId: id! });
      await refetch();
      alert('Đã xác nhận chứng từ thành công');
    } catch (error: any) {
      alert(error.message || 'Không thể xác nhận chứng từ');
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'READY':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy chuyến hàng</p>
          <Link to="/customer/shipments" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to="/customer/shipments"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  {shipment.shipmentNumber}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(shipment.currentStatus)}`}>
                  {shipment.currentStatus}
                </span>
              </div>
              <p className="text-gray-600">Khách hàng: {shipment.customer.name}</p>
            </div>

            {shipment.currentStatus === 'COMPLETED' && (
              <button
                onClick={handleConfirmDocuments}
                disabled={isConfirming}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-300"
              >
                {isConfirming ? 'Đang xác nhận...' : 'Xác nhận đã nhận chứng từ'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipment Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Thông tin chuyến hàng</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Độ ưu tiên</span>
                    <p className="font-medium text-gray-900">
                      {shipment.priority === 'URGENT' ? 'Khẩn cấp' :
                       shipment.priority === 'HIGH' ? 'Cao' :
                       shipment.priority === 'NORMAL' ? 'Bình thường' : 'Thấp'}
                    </p>
                  </div>
                  {shipment.containerNumber && (
                    <div>
                      <span className="text-gray-600">Số container</span>
                      <p className="font-medium text-gray-900">{shipment.containerNumber}</p>
                    </div>
                  )}
                  {shipment.containerType && (
                    <div>
                      <span className="text-gray-600">Loại container</span>
                      <p className="font-medium text-gray-900">
                        {shipment.containerType.replace('CONTAINER_', '').replace('_', ' ')}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Ngày bắt đầu dự kiến</span>
                    <p className="font-medium text-gray-900">
                      {new Date(shipment.plannedStartDate).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày kết thúc dự kiến</span>
                    <p className="font-medium text-gray-900">
                      {new Date(shipment.plannedEndDate).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {shipment.actualStartDate && (
                    <div>
                      <span className="text-gray-600">Ngày bắt đầu thực tế</span>
                      <p className="font-medium text-gray-900">
                        {new Date(shipment.actualStartDate).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {shipment.actualEndDate && (
                    <div>
                      <span className="text-gray-600">Ngày kết thúc thực tế</span>
                      <p className="font-medium text-gray-900">
                        {new Date(shipment.actualEndDate).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {shipment.specialInstructions && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Yêu cầu đặc biệt</span>
                      <p className="font-medium text-gray-900 mt-1">{shipment.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stops */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Điểm dừng ({shipment.stops.length})</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {shipment.stops.map((stop: any, index: number) => (
                    <div key={stop.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow"></div>
                      {index < shipment.stops.length - 1 && (
                        <div className="absolute left-1.5 top-6 w-0.5 h-full bg-gray-300"></div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{stop.locationName}</h4>
                            <p className="text-sm text-gray-600">{stop.address}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                            {stop.stopType}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <span className="text-gray-600">Đến:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(stop.plannedArrival).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Rời:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(stop.plannedDeparture).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {stop.contactPerson && (
                          <p className="text-sm text-gray-600 mt-2">
                            Liên hệ: {stop.contactPerson} {stop.contactPhone && `(${stop.contactPhone})`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Events */}
            {shipment.statusEvents && shipment.statusEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Lịch sử trạng thái</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {shipment.statusEvents.map((event: any) => (
                      <div key={event.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-600"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{event.description}</p>
                          <p className="text-gray-600 text-xs mt-1">
                            {new Date(event.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Dispatch & POD */}
          <div className="space-y-6">
            {/* Dispatch Info */}
            {shipment.dispatch && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin điều xe</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Xe</span>
                    <p className="font-medium text-gray-900">{shipment.dispatch.vehicle.licensePlate}</p>
                    <p className="text-sm text-gray-600">
                      {shipment.dispatch.vehicle.vehicleType === 'TRACTOR' ? 'Đầu kéo' : 'Mooc'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tài xế</span>
                    <p className="font-medium text-gray-900">{shipment.dispatch.driver.user.fullName}</p>
                    <p className="text-sm text-gray-600">{shipment.dispatch.driver.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Thời gian phân công</span>
                    <p className="font-medium text-gray-900">
                      {new Date(shipment.dispatch.assignedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {shipment.dispatch.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Ghi chú</span>
                      <p className="text-sm text-gray-900 mt-1">{shipment.dispatch.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* POD Documents */}
            {shipment.pods && shipment.pods.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Chứng từ giao hàng ({shipment.pods.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {shipment.pods.map((pod: any) => (
                      <div key={pod.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{pod.fileName}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(pod.uploadedAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={pod.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Xem
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Created By Info */}
            {shipment.createdBy && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Người tạo</h3>
                <p className="font-medium text-gray-900">{shipment.createdBy.fullName}</p>
                <p className="text-sm text-gray-600">{shipment.createdBy.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {shipment.createdByType === 'CUSTOMER' ? 'Khách hàng' : 'Nội bộ'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
