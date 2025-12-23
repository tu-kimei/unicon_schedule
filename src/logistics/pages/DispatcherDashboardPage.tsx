import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getPendingShipments, getAvailableVehicles, getAvailableDrivers, createDispatch } from 'wasp/client/operations';
import { StatusBadge } from '../components/StatusBadge';

interface Shipment {
  id: string;
  shipmentNumber: string;
  priority: string;
  stops: Array<{ locationName: string; stopType: string }>;
  order: { customer: { name: string } };
}

interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: string;
  status: string;
}

interface Driver {
  id: string;
  driverCode: string;
  fullName: string;
  status: string;
}

export const DispatcherDashboardPage = () => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch data
  const { data: pendingShipments, isLoading: shipmentsLoading } = useQuery(getPendingShipments);
  const { data: availableVehicles, isLoading: vehiclesLoading } = useQuery(getAvailableVehicles);
  const { data: availableDrivers, isLoading: driversLoading } = useQuery(getAvailableDrivers);

  const handleShipmentClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowAssignModal(true);
  };

  const handleAssignDispatch = async (vehicleId: string, driverId: string, notes: string) => {
    if (!selectedShipment) return;

    try {
      await createDispatch({
        shipmentId: selectedShipment.id,
        vehicleId,
        driverId,
        notes
      });

      // Close modal and refresh data
      setShowAssignModal(false);
      setSelectedShipment(null);

      // Refetch data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to assign dispatch:', error);
      alert('Failed to assign dispatch. Please try again.');
    }
  };

  const isLoading = shipmentsLoading || vehiclesLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Dispatcher Dashboard</h1>
              <p className="text-gray-600">Assign vehicles and drivers to shipments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Shipments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Shipments ({pendingShipments?.length || 0})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Shipments ready for dispatch</p>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {pendingShipments && pendingShipments.length > 0 ? (
                <div className="space-y-3">
                  {pendingShipments.map((shipment: Shipment) => (
                    <div
                      key={shipment.id}
                      onClick={() => handleShipmentClick(shipment)}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {shipment.shipmentNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {shipment.order.customer.name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          shipment.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          shipment.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {shipment.priority}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>{shipment.stops.length} stops</p>
                        <p className="truncate">
                          {shipment.stops.slice(0, 2).map(stop => stop.locationName).join(' → ')}
                          {shipment.stops.length > 2 && '...'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending shipments</p>
                </div>
              )}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            {/* Available Vehicles */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Vehicles ({availableVehicles?.length || 0})
                </h2>
              </div>

              <div className="px-6 py-4 max-h-48 overflow-y-auto">
                {availableVehicles && availableVehicles.length > 0 ? (
                  <div className="space-y-2">
                    {availableVehicles.map((vehicle: Vehicle) => (
                      <div key={vehicle.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{vehicle.licensePlate}</p>
                          <p className="text-sm text-gray-600">{vehicle.vehicleType.replace('_', ' ')}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Available
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No vehicles available</p>
                )}
              </div>
            </div>

            {/* Available Drivers */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Drivers ({availableDrivers?.length || 0})
                </h2>
              </div>

              <div className="px-6 py-4 max-h-48 overflow-y-auto">
                {availableDrivers && availableDrivers.length > 0 ? (
                  <div className="space-y-2">
                    {availableDrivers.map((driver: Driver) => (
                      <div key={driver.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{driver.fullName}</p>
                          <p className="text-sm text-gray-600">{driver.driverCode}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No drivers available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Assignment Modal */}
      {showAssignModal && selectedShipment && (
        <DispatchModal
          shipment={selectedShipment}
          vehicles={availableVehicles || []}
          drivers={availableDrivers || []}
          onAssign={handleAssignDispatch}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedShipment(null);
          }}
        />
      )}
    </div>
  );
};

// Dispatch Assignment Modal Component
interface DispatchModalProps {
  shipment: Shipment;
  vehicles: Vehicle[];
  drivers: Driver[];
  onAssign: (vehicleId: string, driverId: string, notes: string) => Promise<void>;
  onClose: () => void;
}

const DispatchModal = ({ shipment, vehicles, drivers, onAssign, onClose }: DispatchModalProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedVehicle || !selectedDriver) return;

    setIsAssigning(true);
    try {
      await onAssign(selectedVehicle, selectedDriver, notes);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assign Dispatch</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Shipment Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-medium text-gray-900">{shipment.shipmentNumber}</h3>
            <p className="text-sm text-gray-600">{shipment.order.customer.name}</p>
            <p className="text-sm text-gray-600">{shipment.stops.length} stops</p>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate} - {vehicle.vehicleType.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName} ({driver.driverCode})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Special instructions for the driver..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isAssigning}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedVehicle || !selectedDriver || isAssigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Assigning...' : 'Assign Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
};
