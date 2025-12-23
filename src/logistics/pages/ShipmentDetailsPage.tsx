import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getShipment } from 'wasp/client/operations';
import { StatusBadge } from '../components/StatusBadge';

export const ShipmentDetailsPage = ({ shipmentId }: { shipmentId: string }) => {
  const { data: shipment, isLoading, error } = useQuery(getShipment, { id: shipmentId });

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
                <h1 className="text-2xl font-bold text-gray-900">
                  Shipment {shipment.shipmentNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Order: {shipment.order.orderNumber} - {shipment.order.customer.name}
                </p>
              </div>
              <StatusBadge status={shipment.currentStatus} size="lg" />
            </div>
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
                  {new Date(shipment.plannedStartDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">End Date</span>
                <p className="font-medium">
                  {new Date(shipment.plannedEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Dispatch Info */}
            {shipment.dispatch && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Dispatch Information</h3>
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
                    <p className="font-medium">
                      {new Date(shipment.dispatch.assignedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700">Notes:</span>
                    <p className="font-medium">{shipment.dispatch.notes || 'None'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {stop.stopType}
                      </span>
                    </div>

                    <div className="text-right text-sm">
                      <div className="mb-1">
                        <span className="text-gray-600">Planned:</span>
                        <p>{new Date(stop.plannedArrival).toLocaleString()}</p>
                        <p>to {new Date(stop.plannedDeparture).toLocaleString()}</p>
                      </div>

                      {(stop.actualArrival || stop.actualDeparture) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Actual:</span>
                          {stop.actualArrival && <p>Arrival: {new Date(stop.actualArrival).toLocaleString()}</p>}
                          {stop.actualDeparture && <p>Departure: {new Date(stop.actualDeparture).toLocaleString()}</p>}
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

                  {stop.specialInstructions && (
                    <div>
                      <span className="text-sm text-gray-600">Instructions:</span>
                      <p className="text-sm mt-1">{stop.specialInstructions}</p>
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
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PODs */}
        {shipment.pods && shipment.pods.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Proof of Delivery</h2>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shipment.pods.map((pod: any) => (
                  <div key={pod.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pod.fileName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        pod.isSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pod.isSubmitted ? 'Submitted' : 'Draft'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Type: {pod.fileType.replace('_', ' ')}</p>
                      <p>Size: {(pod.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      <p>Uploaded: {new Date(pod.uploadedAt).toLocaleString()}</p>
                    </div>

                    {pod.isSubmitted && (
                      <button className="mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                        View POD
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
