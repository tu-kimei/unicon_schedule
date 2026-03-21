import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import {
  getShipment,
  updateDocumentStatus,
} from 'wasp/client/operations';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentSection } from '../components/DocumentSection';

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
  DOC_RECEIVED: 'Da nhan chung tu',
  DOC_RETURNED: 'Da tra chung tu',
};

const financialStatusLabels: Record<string, string> = {
  NOT_BILLED: 'Chua xuat HD',
  INVOICED: 'Da xuat HD',
  PARTIAL_PAID: 'TT mot phan',
  PAID: 'Da thanh toan',
  OVERDUE: 'Qua han',
};

const operationStatusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-blue-100 text-blue-800',
  DISPATCHED: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const documentStatusStyles: Record<string, string> = {
  DOC_PENDING: 'bg-orange-100 text-orange-800',
  DOC_RECEIVED: 'bg-blue-100 text-blue-800',
  DOC_RETURNED: 'bg-green-100 text-green-800',
};

const financialStatusStyles: Record<string, string> = {
  NOT_BILLED: 'bg-gray-100 text-gray-800',
  INVOICED: 'bg-blue-100 text-blue-800',
  PARTIAL_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

const photoCategoryLabels: Record<string, string> = {
  CONTAINER_EXTERIOR: 'Ngoai container',
  CONTAINER_INTERIOR: 'Trong container',
  PORT_GATE_PASS: 'Phieu cong cang',
  WAREHOUSE_GATE_PASS: 'Phieu cong kho',
  WEIGHT_TICKET: 'Phieu can',
  OTHER: 'Khac',
};

export const ShipmentDetailsPage = ({ shipmentId }: { shipmentId: string }) => {
  const { data: user } = useAuth();
  const { data: shipment, isLoading, error, refetch } = useQuery(getShipment, { id: shipmentId });
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);

  const handleUpdateDocStatus = async (newStatus: 'DOC_RECEIVED' | 'DOC_RETURNED') => {
    setIsUpdatingDoc(true);
    try {
      await updateDocumentStatus({
        shipmentId,
        documentStatus: newStatus,
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Khong the cap nhat trang thai chung tu');
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
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

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error ? `Error: ${error.message}` : 'Shipment not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Shipment {shipment.shipmentNumber}
                  </h1>
                  {shipment.shipmentType && (
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {shipment.shipmentType}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  Customer: {shipment.customer.name}
                </p>
              </div>
              <StatusBadge status={shipment.currentStatus as any} size="lg" />
            </div>

            {/* 3 Status Badges */}
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Van hanh:</span>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  operationStatusStyles[shipment.operationStatus] || 'bg-gray-100 text-gray-800'
                }`}>
                  {operationStatusLabels[shipment.operationStatus] || shipment.operationStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Chung tu:</span>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  documentStatusStyles[shipment.documentStatus] || 'bg-gray-100 text-gray-800'
                }`}>
                  {documentStatusLabels[shipment.documentStatus] || shipment.documentStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Tai chinh:</span>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  financialStatusStyles[shipment.financialStatus] || 'bg-gray-100 text-gray-800'
                }`}>
                  {financialStatusLabels[shipment.financialStatus] || shipment.financialStatus}
                </span>
              </div>
            </div>

            {/* OPS Document Status Buttons */}
            {user && ['ADMIN', 'OPS'].includes(user.role) && (
              <div className="mt-4 flex gap-2">
                {shipment.documentStatus === 'DOC_PENDING' && (
                  <button
                    onClick={() => handleUpdateDocStatus('DOC_RECEIVED')}
                    disabled={isUpdatingDoc}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium disabled:bg-gray-300"
                  >
                    {isUpdatingDoc ? 'Dang cap nhat...' : 'Da nhan chung tu'}
                  </button>
                )}
                {shipment.documentStatus === 'DOC_RECEIVED' && (
                  <button
                    onClick={() => handleUpdateDocStatus('DOC_RETURNED')}
                    disabled={isUpdatingDoc}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium disabled:bg-gray-300"
                  >
                    {isUpdatingDoc ? 'Dang cap nhat...' : 'Da tra chung tu'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Shipment Overview */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Priority</span>
                <p className="font-medium">{shipment.priority}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Stops</span>
                <p className="font-medium">{shipment.stops.length}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Start Date</span>
                <p className="font-medium">
                  {new Date(shipment.plannedStartDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">End Date</span>
                <p className="font-medium">
                  {new Date(shipment.plannedEndDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Tasks */}
        {shipment.driverTasks && shipment.driverTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Driver Tasks</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {shipment.driverTasks.map((task: any) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">#{task.sequence}</span>
                          <span className="font-medium text-gray-900">{task.driver?.fullName || task.driver?.user?.fullName}</span>
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                            task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'SKIPPED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                          <p>Dau keo: {task.tractor?.licensePlate}</p>
                          {task.trailer && <p>Mooc: {task.trailer.licensePlate}</p>}
                          {task.instructions && (
                            <p className="text-blue-600">{task.instructions}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {task.startedAt && <p>Bat dau: {new Date(task.startedAt).toLocaleString('vi-VN')}</p>}
                        {task.completedAt && <p>Hoan thanh: {new Date(task.completedAt).toLocaleString('vi-VN')}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legacy Dispatch Info (backwards compatibility) */}
        {shipment.dispatch && !shipment.driverTasks?.length && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Dispatch Information</h2>
            </div>
            <div className="px-6 py-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Vehicle:</span>
                    <p className="font-medium">{shipment.dispatch.vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Driver:</span>
                    <p className="font-medium">{shipment.dispatch.driver.user.fullName}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Assigned:</span>
                    <p className="font-medium">{new Date(shipment.dispatch.assignedAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Notes:</span>
                    <p className="font-medium">{shipment.dispatch.notes || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stops */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Shipment Stops</h2>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-4">
              {shipment.stops.map((stop: any) => (
                <div key={stop.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium">
                        Stop {stop.sequence}: {stop.locationName}
                      </h3>
                      <p className="text-gray-600">{stop.address}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {stop.stopType}
                        </span>
                        {stop.stopCategory && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {stop.stopCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <div className="mb-1">
                        <span className="text-gray-600">Planned:</span>
                        <p>{new Date(stop.plannedArrival).toLocaleString('vi-VN')}</p>
                        <p>to {new Date(stop.plannedDeparture).toLocaleString('vi-VN')}</p>
                      </div>

                      {(stop.actualArrival || stop.actualDeparture) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Actual:</span>
                          {stop.actualArrival && <p>Arrival: {new Date(stop.actualArrival).toLocaleString('vi-VN')}</p>}
                          {stop.actualDeparture && <p>Departure: {new Date(stop.actualDeparture).toLocaleString('vi-VN')}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {(stop.contactPerson || stop.contactPhone) && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">Contact:</span>
                      <p className="text-sm">
                        {stop.contactPerson}
                        {stop.contactPhone && ` (${stop.contactPhone})`}
                      </p>
                    </div>
                  )}

                  {/* PODs grouped by stop and photoCategory */}
                  {shipment.pods && shipment.pods.filter((p: any) => p.stopId === stop.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Anh chung tu:</p>
                      <div className="space-y-2">
                        {Object.entries(
                          shipment.pods
                            .filter((p: any) => p.stopId === stop.id)
                            .reduce((acc: Record<string, any[]>, pod: any) => {
                              const cat = pod.photoCategory || 'OTHER';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(pod);
                              return acc;
                            }, {})
                        ).map(([category, pods]: [string, any[]]) => (
                          <div key={category}>
                            <span className="text-xs text-gray-500">
                              {photoCategoryLabels[category] || category}:
                            </span>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {pods.map((pod: any) => (
                                <a
                                  key={pod.id}
                                  href={pod.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-16 h-16 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-blue-400 overflow-hidden"
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
              ))}
            </div>
          </div>
        </div>

        {/* Status Events */}
        {shipment.statusEvents && shipment.statusEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Status History</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {shipment.statusEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.description}</p>
                      {event.location && (
                        <p className="text-sm text-gray-600">Location: {event.location}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        <DocumentSection shipmentId={shipmentId} />
      </div>
    </div>
  );
};
