import { useQuery } from 'wasp/client/operations';
import { getMyShipmentStats, getMyShipments } from 'wasp/client/operations';
import { Link } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';

export const CustomerDashboardPage = () => {
  const { data: user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery(getMyShipmentStats);
  const { data: shipments, isLoading: shipmentsLoading } = useQuery(getMyShipments);

  // Get recent shipments (last 5)
  const recentShipments = shipments?.slice(0, 5) || [];

  const StatCard = ({ title, value, color, icon }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value || 0}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trang chủ</h1>
              <p className="text-gray-600 mt-1">Xin chào, {user?.fullName}</p>
            </div>
            <Link
              to="/customer/shipments/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo yêu cầu vận chuyển
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng số chuyến"
            value={stats?.total}
            color="text-blue-600"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          
          <StatCard
            title="Đang hoạt động"
            value={stats?.active}
            color="text-yellow-600"
            icon={
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          
          <StatCard
            title="Đang vận chuyển"
            value={stats?.inTransit}
            color="text-orange-600"
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            }
          />
          
          <StatCard
            title="Đã hoàn thành"
            value={stats?.completed}
            color="text-green-600"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Chuyến hàng gần đây</h2>
            <Link
              to="/customer/shipments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="p-6">
            {shipmentsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Đang tải...</p>
              </div>
            ) : recentShipments.length > 0 ? (
              <div className="space-y-4">
                {recentShipments.map((shipment: any) => (
                  <Link
                    key={shipment.id}
                    to={`/customer/shipments/${shipment.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{shipment.shipmentNumber}</h3>
                        {shipment.containerNumber && (
                          <p className="text-sm text-gray-600">Container: {shipment.containerNumber}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(shipment.currentStatus)}`}>
                        {shipment.currentStatus}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Độ ưu tiên:</span>
                        <span className={`ml-2 font-medium ${
                          shipment.priority === 'URGENT' ? 'text-red-600' :
                          shipment.priority === 'HIGH' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {shipment.priority === 'URGENT' ? 'Khẩn cấp' :
                           shipment.priority === 'HIGH' ? 'Cao' :
                           shipment.priority === 'NORMAL' ? 'Bình thường' : 'Thấp'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Điểm dừng:</span>
                        <span className="ml-2 font-medium text-gray-900">{shipment.stops.length}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Ngày bắt đầu:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(shipment.plannedStartDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {shipment.dispatch && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-gray-600">Xe:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {shipment.dispatch.vehicle.licensePlate}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tài xế:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {shipment.dispatch.driver.user.fullName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-600 mb-4">Chưa có chuyến hàng nào</p>
                <Link
                  to="/customer/shipments/create"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo chuyến hàng đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {user?.role === 'CUSTOMER_OWNER' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/customer/debts"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Xem công nợ</h3>
                  <p className="text-sm text-gray-600">Kiểm tra tình trạng thanh toán</p>
                </div>
              </div>
            </Link>

            <Link
              to="/customer/shipments"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tất cả chuyến hàng</h3>
                  <p className="text-sm text-gray-600">Xem lịch sử vận chuyển đầy đủ</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
