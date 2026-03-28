import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { useParams, Link } from 'react-router-dom';
import {
  getShipment,
  updateDocumentStatus,
} from 'wasp/client/operations';
import { RoleGuard } from '../../shared/components/RoleGuard';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentSection } from '../components/DocumentSection';

// ============================================================================
// Constants & Labels
// ============================================================================

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

const containerTypeLabels: Record<string, string> = {
  CONTAINER_20FT: "Container 20'",
  CONTAINER_40FT: "Container 40'",
  CONTAINER_40HC: "Container 40' HC",
  CONTAINER_45FT: "Container 45'",
  FLATBED: 'Sàn phẳng',
  TANK: 'Bồn',
  REFRIGERATED: 'Đông lạnh',
  OPEN_TOP: 'Mở nắp',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const stopCategoryLabels: Record<string, string> = {
  PICKUP_EMPTY: 'Lấy container rỗng',
  WAREHOUSE_LOAD: 'Đóng hàng tại kho',
  PORT_DELIVERY: 'Giao tại cảng',
  PORT_PICKUP: 'Lấy hàng tại cảng',
  WAREHOUSE_UNLOAD: 'Dỡ hàng tại kho',
  RETURN_EMPTY: 'Trả container rỗng',
};

const taskStatusLabels: Record<string, string> = {
  PENDING: 'Chờ',
  IN_PROGRESS: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  SKIPPED: 'Bỏ qua',
};

const photoCategoryLabels: Record<string, string> = {
  CONTAINER_EXTERIOR: 'Ngoài container',
  CONTAINER_INTERIOR: 'Trong container',
  PORT_GATE_PASS: 'Phiếu cổng cảng',
  WAREHOUSE_GATE_PASS: 'Phiếu cổng kho',
  WEIGHT_TICKET: 'Phiếu cân',
  OTHER: 'Khác',
};

// ============================================================================
// Progress Bar helpers
// ============================================================================

type ProgressStep = {
  label: string;
  status: 'done' | 'in_progress' | 'not_started';
  detail: string;
};

function getOperationProgress(opStatus: string): ProgressStep['status'] {
  if (['DELIVERED', 'CANCELLED'].includes(opStatus)) return 'done';
  if (['DISPATCHED', 'IN_TRANSIT'].includes(opStatus)) return 'in_progress';
  return 'not_started';
}

function getDocumentProgress(docStatus: string): ProgressStep['status'] {
  if (docStatus === 'DOC_RETURNED') return 'done';
  if (docStatus === 'DOC_RECEIVED') return 'in_progress';
  return 'not_started';
}

function getFinancialProgress(finStatus: string): ProgressStep['status'] {
  if (['PAID'].includes(finStatus)) return 'done';
  if (['INVOICED', 'PARTIAL_PAID', 'OVERDUE'].includes(finStatus)) return 'in_progress';
  return 'not_started';
}

const stepColorMap: Record<ProgressStep['status'], { circle: string; text: string; line: string }> = {
  done: { circle: 'bg-green-500 text-white', text: 'text-green-700', line: 'bg-green-500' },
  in_progress: { circle: 'bg-yellow-400 text-white', text: 'text-yellow-700', line: 'bg-yellow-400' },
  not_started: { circle: 'bg-gray-300 text-white', text: 'text-gray-500', line: 'bg-gray-300' },
};

// ============================================================================
// Tab definitions
// ============================================================================

type TabKey = 'overview' | 'stops' | 'driver' | 'history';

// ============================================================================
// Main component
// ============================================================================

export const ShipmentDetailsPage = () => {
  const { id: shipmentId } = useParams<{ id: string }>();
  const { data: user } = useAuth();
  const { data: shipment, isLoading, error, refetch } = useQuery(getShipment, { id: shipmentId! });
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const handleUpdateDocStatus = async (newStatus: 'DOC_RECEIVED' | 'DOC_RETURNED') => {
    setIsUpdatingDoc(true);
    try {
      await updateDocumentStatus({
        shipmentId: shipmentId!,
        documentStatus: newStatus,
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái chứng từ');
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error ? `Lỗi: ${error.message}` : 'Không tìm thấy chuyến hàng'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Build progress steps
  const progressSteps: ProgressStep[] = [
    {
      label: 'Vận hành',
      status: getOperationProgress(shipment.operationStatus),
      detail: operationStatusLabels[shipment.operationStatus] || shipment.operationStatus,
    },
    {
      label: 'Chứng từ',
      status: getDocumentProgress(shipment.documentStatus),
      detail: documentStatusLabels[shipment.documentStatus] || shipment.documentStatus,
    },
    {
      label: 'Tài chính',
      status: getFinancialProgress(shipment.financialStatus),
      detail: financialStatusLabels[shipment.financialStatus] || shipment.financialStatus,
    },
  ];

  const shipmentTypeLabel = shipment.shipmentType === 'EXPORT' ? 'Xuất' : shipment.shipmentType === 'IMPORT' ? 'Nhập' : shipment.shipmentType;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'stops', label: 'Điểm dừng', count: shipment.stops?.length },
    { key: 'driver', label: 'Tài xế' },
    { key: 'history', label: 'Lịch sử' },
  ];

  return (
    <RoleGuard allowedRoles={['OPS', 'ADMIN', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50">
        {/* ================================================================
            Sticky Header
            ================================================================ */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            {/* Row 1: Back + title + badges */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Link
                  to="/ops/shipments"
                  className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-heading font-bold text-gray-900">
                      Chuyến hàng {shipment.shipmentNumber}
                    </h1>
                    {shipmentTypeLabel && (
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                        shipment.shipmentType === 'EXPORT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {shipmentTypeLabel}
                      </span>
                    )}
                    {shipment.containerType && (
                      <span className="px-2 py-0.5 text-xs rounded font-medium bg-blue-100 text-blue-800">
                        {containerTypeLabels[shipment.containerType] || shipment.containerType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Khách hàng: {shipment.customer?.name}
                    {shipment.containerNumber && (
                      <span className="ml-4">Số cont: <span className="font-medium">{shipment.containerNumber}</span></span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 2: Progress bar */}
            <div className="flex items-center justify-center gap-0 mb-3">
              {progressSteps.map((step, idx) => {
                const colors = stepColorMap[step.status];
                return (
                  <div key={step.label} className="flex items-center">
                    {/* Step circle + label */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colors.circle}`}>
                        {idx + 1}
                      </div>
                      <span className={`text-xs font-medium mt-1 ${colors.text}`}>{step.label}</span>
                      <span className={`text-xs ${colors.text}`}>{step.detail}</span>
                    </div>
                    {/* Connecting line (not after last step) */}
                    {idx < progressSteps.length - 1 && (
                      <div className={`w-24 h-1 mx-2 rounded ${
                        progressSteps[idx + 1].status !== 'not_started' ? stepColorMap[progressSteps[idx + 1].status].line : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Row 3: OPS document actions (conditional) */}
            {user && ['ADMIN', 'OPS'].includes(user.role) && (
              <div className="flex gap-2 mb-3">
                {shipment.documentStatus === 'DOC_PENDING' && (
                  <button
                    onClick={() => handleUpdateDocStatus('DOC_RECEIVED')}
                    disabled={isUpdatingDoc}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 transition-colors duration-200 text-white text-sm rounded font-medium cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isUpdatingDoc ? 'Đang cập nhật...' : 'Đánh dấu đã nhận CT'}
                  </button>
                )}
                {shipment.documentStatus === 'DOC_RECEIVED' && (
                  <button
                    onClick={() => handleUpdateDocStatus('DOC_RETURNED')}
                    disabled={isUpdatingDoc}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 transition-colors duration-200 text-white text-sm rounded font-medium cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isUpdatingDoc ? 'Đang cập nhật...' : 'Đã trả CT'}
                  </button>
                )}
              </div>
            )}

            {/* Row 4: Tabs */}
            <div className="flex gap-6 border-b border-gray-200 -mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                    activeTab === tab.key
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 text-xs">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================
            Tab Content
            ================================================================ */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* ============================================================
              Tab 1: Tổng quan
              ============================================================ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Thông tin chuyến */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chuyến</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Mức ưu tiên</dt>
                    <dd className="text-sm font-medium">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        shipment.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        shipment.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        shipment.priority === 'LOW' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {priorityLabels[shipment.priority] || shipment.priority}
                      </span>
                    </dd>
                  </div>
                  {shipment.containerNumber && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Số container</dt>
                      <dd className="text-sm font-medium">{shipment.containerNumber}</dd>
                    </div>
                  )}
                  {shipment.containerType && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Loại container</dt>
                      <dd className="text-sm font-medium">{containerTypeLabels[shipment.containerType] || shipment.containerType}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Ngày bắt đầu</dt>
                    <dd className="text-sm font-medium">{new Date(shipment.plannedStartDate).toLocaleDateString('vi-VN')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Ngày kết thúc</dt>
                    <dd className="text-sm font-medium">{new Date(shipment.plannedEndDate).toLocaleDateString('vi-VN')}</dd>
                  </div>
                  {shipment.specialRequirements && (
                    <div>
                      <dt className="text-sm text-gray-600 mb-1">Yêu cầu đặc biệt</dt>
                      <dd className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">{shipment.specialRequirements}</dd>
                    </div>
                  )}
                </dl>

                {/* Documents section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <DocumentSection shipmentId={shipmentId!} />
                </div>
              </div>

              {/* Right: Lộ trình */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lộ trình</h2>
                {shipment.stops && shipment.stops.length > 0 ? (
                  <div className="relative">
                    {shipment.stops
                      .slice()
                      .sort((a: any, b: any) => a.sequence - b.sequence)
                      .map((stop: any, idx: number, arr: any[]) => (
                      <div key={stop.id} className="flex items-start gap-3 mb-0">
                        {/* Timeline dot + line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            stop.actualDeparture ? 'bg-green-500 text-white' :
                            stop.actualArrival ? 'bg-yellow-400 text-white' :
                            'bg-gray-300 text-white'
                          }`}>
                            {stop.sequence}
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="w-0.5 h-10 bg-gray-200 my-1" />
                          )}
                        </div>
                        {/* Stop info */}
                        <div className="pb-4">
                          <p className="text-sm font-medium text-gray-900">{stop.locationName}</p>
                          {stop.stopCategory && (
                            <span className="text-xs text-gray-500">
                              {stopCategoryLabels[stop.stopCategory] || stop.stopCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có điểm dừng</p>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              Tab 2: Điểm dừng
              ============================================================ */}
          {activeTab === 'stops' && (
            <div className="space-y-4">
              {shipment.stops
                .slice()
                .sort((a: any, b: any) => a.sequence - b.sequence)
                .map((stop: any) => {
                const stopPods = shipment.pods?.filter((p: any) => p.stopId === stop.id) || [];
                const requiredPhotos = stop.requiredPhotos || [];

                return (
                  <div key={stop.id} className="bg-white rounded-lg shadow">
                    {/* Stop header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                            {stop.sequence}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {stopCategoryLabels[stop.stopCategory] || stop.stopCategory || stop.stopType}
                            </h3>
                            <span className="text-xs text-gray-500 uppercase">{stop.stopCategory}</span>
                          </div>
                        </div>
                        <StatusBadge
                          status={
                            stop.actualDeparture ? 'COMPLETED' :
                            stop.actualArrival ? 'IN_TRANSIT' :
                            'DRAFT'
                          }
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                      {/* Location + Address */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{stop.locationName}</p>
                        {stop.address && (
                          <p className="text-sm text-gray-600">{stop.address}</p>
                        )}
                      </div>

                      {/* Contact info */}
                      {(stop.contactPerson || stop.contactPhone) && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-700">
                            {stop.contactPerson}
                            {stop.contactPhone && ` - ${stop.contactPhone}`}
                          </span>
                        </div>
                      )}

                      {/* Planned vs Actual times */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Dự kiến</p>
                          <p className="text-sm">Đến: {new Date(stop.plannedArrival).toLocaleString('vi-VN')}</p>
                          <p className="text-sm">Đi: {new Date(stop.plannedDeparture).toLocaleString('vi-VN')}</p>
                        </div>
                        {(stop.actualArrival || stop.actualDeparture) && (
                          <div className="bg-green-50 rounded p-3">
                            <p className="text-xs font-medium text-green-700 mb-1">Thực tế</p>
                            {stop.actualArrival && <p className="text-sm">Đến: {new Date(stop.actualArrival).toLocaleString('vi-VN')}</p>}
                            {stop.actualDeparture && <p className="text-sm">Đi: {new Date(stop.actualDeparture).toLocaleString('vi-VN')}</p>}
                          </div>
                        )}
                      </div>

                      {/* Required photos checklist */}
                      {requiredPhotos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Ảnh yêu cầu</p>
                          <div className="space-y-1">
                            {requiredPhotos.map((cat: string) => {
                              const uploaded = stopPods.filter((p: any) => (p.photoCategory || 'OTHER') === cat);
                              return (
                                <div key={cat} className="flex items-center gap-2 text-sm">
                                  {uploaded.length > 0 ? (
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                    </svg>
                                  )}
                                  <span className={uploaded.length > 0 ? 'text-gray-700' : 'text-gray-400'}>
                                    {photoCategoryLabels[cat] || cat}
                                  </span>
                                  {uploaded.length > 0 && (
                                    <span className="text-xs text-gray-500">({uploaded.length})</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Uploaded photos grid */}
                      {stopPods.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Ảnh đã tải lên</p>
                          <div className="space-y-3">
                            {Object.entries(
                              stopPods.reduce((acc: Record<string, any[]>, pod: any) => {
                                const cat = pod.photoCategory || 'OTHER';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(pod);
                                return acc;
                              }, {})
                            ).map(([category, pods]: [string, unknown]) => (
                              <div key={category}>
                                <span className="text-xs text-gray-500 font-medium">
                                  {photoCategoryLabels[category] || category}
                                </span>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {(pods as any[]).map((pod: any) => (
                                    <a
                                      key={pod.id}
                                      href={pod.filePath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-16 h-16 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-primary-400 overflow-hidden cursor-pointer transition-colors duration-200"
                                    >
                                      {pod.filePath.match(/\.(jpg|jpeg|png)$/i) ? (
                                        <img src={pod.filePath} alt={pod.fileName} className="w-full h-full object-cover" />
                                      ) : (
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================
              Tab 3: Tài xế
              ============================================================ */}
          {activeTab === 'driver' && (
            <div className="space-y-4">
              {shipment.driverTasks && shipment.driverTasks.length > 0 ? (
                shipment.driverTasks.map((task: any) => (
                  <div key={task.id} className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-bold">
                            #{task.sequence}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {task.driver?.fullName || task.driver?.user?.fullName || 'Chưa gán tài xế'}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded font-medium ${
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'SKIPPED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {taskStatusLabels[task.status] || task.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 space-y-1">
                          {task.startedAt && <p>Bắt đầu: {new Date(task.startedAt).toLocaleString('vi-VN')}</p>}
                          {task.completedAt && <p>Hoàn thành: {new Date(task.completedAt).toLocaleString('vi-VN')}</p>}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-xs text-gray-500">Đầu kéo</span>
                          <p className="font-medium">{task.tractor?.licensePlate || '---'}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-xs text-gray-500">Rơ moóc</span>
                          <p className="font-medium">{task.trailer?.licensePlate || '---'}</p>
                        </div>
                        {task.instructions && (
                          <div className="bg-primary-50 rounded p-2">
                            <span className="text-xs text-primary-600">Ghi chú</span>
                            <p className="font-medium text-primary-700">{task.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Chưa có chuyến tài xế nào được gán
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              Tab 4: Lịch sử
              ============================================================ */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4">
                {shipment.statusEvents && shipment.statusEvents.length > 0 ? (
                  <div className="space-y-4">
                    {shipment.statusEvents.map((event: any, idx: number) => (
                      <div key={event.id} className="flex items-start gap-4">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary-400 shrink-0 mt-1" />
                          {idx < shipment.statusEvents.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                          )}
                        </div>
                        {/* Event content */}
                        <div className="pb-4 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={event.status} size="sm" />
                            {event.user && (
                              <span className="text-xs text-gray-500">
                                bởi {event.user.fullName || event.user.email}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-700">{event.description}</p>
                          )}
                          {event.location && (
                            <p className="text-sm text-gray-500">Vị trí: {event.location}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(event.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Chưa có lịch sử trạng thái</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};
