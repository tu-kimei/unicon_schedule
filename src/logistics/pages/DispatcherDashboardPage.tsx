import { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getPendingShipments,
  getAvailableVehicles,
  getAvailableDrivers,
  getAllCustomers,
  createDispatch,
  createAndDispatchShipment,
} from 'wasp/client/operations';
import { Dialog } from '../../shared/components/Dialog';
import { Button } from '../../shared/components/Button';

interface Shipment {
  id: string;
  shipmentNumber: string;
  priority: string;
  currentStatus: string;
  createdByType?: string | null;
  plannedStartDate: string;
  plannedEndDate: string;
  specialInstructions?: string | null;
  containerNumber?: string | null;
  containerType?: string | null;
  stops: Array<{ locationName: string; stopType: string; address: string }>;
  customer: { id: string; name: string };
}

interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: string;
  status: string;
}

interface Driver {
  id: string;
  fullName: string;
  status: string;
  user: { fullName: string };
}

interface CustomerItem {
  id: string;
  name: string;
  status: string;
}

const priorityOrder: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

export const DispatcherDashboardPage = () => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuickDispatchModal, setShowQuickDispatchModal] = useState(false);

  // Fetch data
  const {
    data: pendingShipments,
    isLoading: shipmentsLoading,
    refetch: refetchShipments,
  } = useQuery(getPendingShipments);
  const {
    data: availableVehicles,
    isLoading: vehiclesLoading,
    refetch: refetchVehicles,
  } = useQuery(getAvailableVehicles);
  const {
    data: availableDrivers,
    isLoading: driversLoading,
    refetch: refetchDrivers,
  } = useQuery(getAvailableDrivers);
  const { data: allCustomers } = useQuery(getAllCustomers);

  // Separate customer requests from internal shipments
  const customerRequests = useMemo(
    () =>
      (pendingShipments || []).filter(
        (s: Shipment) => s.createdByType === 'CUSTOMER' && s.currentStatus === 'DRAFT'
      ),
    [pendingShipments]
  );

  const internalPending = useMemo(
    () =>
      (pendingShipments || []).filter(
        (s: Shipment) => !(s.createdByType === 'CUSTOMER' && s.currentStatus === 'DRAFT')
      ),
    [pendingShipments]
  );

  const handleShipmentClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowAssignModal(true);
  };

  const refetchAll = () => {
    refetchShipments();
    refetchVehicles();
    refetchDrivers();
  };

  const handleAssignDispatch = async (vehicleId: string, driverId: string, notes: string) => {
    if (!selectedShipment) return;

    try {
      await createDispatch({
        shipmentId: selectedShipment.id,
        vehicleId,
        driverId,
        notes,
      });

      setShowAssignModal(false);
      setSelectedShipment(null);
      refetchAll();
    } catch (error: any) {
      console.error('Failed to assign dispatch:', error);
      alert(error?.message || 'Failed to assign dispatch. Please try again.');
    }
  };

  const handleQuickDispatchSubmit = async (data: any) => {
    try {
      await createAndDispatchShipment(data);
      setShowQuickDispatchModal(false);
      refetchAll();
    } catch (error: any) {
      console.error('Failed to create quick dispatch:', error);
      alert(error?.message || 'Failed to create quick dispatch. Please try again.');
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
            <Button onClick={() => setShowQuickDispatchModal(true)}>
              + Tao & Dispatch nhanh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Customer Requests Section */}
        {customerRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 border-l-4 border-amber-400">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Yeu cau tu Khach hang ({customerRequests.length})
                </h2>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                  Yeu cau tu KH
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Shipments created by customers awaiting dispatch
              </p>
            </div>

            <div className="px-6 py-4 max-h-72 overflow-y-auto">
              <div className="space-y-3">
                {customerRequests.map((shipment: Shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    onClick={() => handleShipmentClick(shipment)}
                    isCustomerRequest
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Shipments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Shipments ({internalPending.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Shipments ready for dispatch</p>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {internalPending.length > 0 ? (
                <div className="space-y-3">
                  {internalPending.map((shipment: Shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => handleShipmentClick(shipment)}
                    />
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
                          <p className="text-sm text-gray-600">
                            {vehicle.vehicleType.replace('_', ' ')}
                          </p>
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
                          <p className="text-sm text-gray-600">{driver.user?.fullName}</p>
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

      {/* Quick Dispatch Modal */}
      <QuickDispatchModal
        open={showQuickDispatchModal}
        onClose={() => setShowQuickDispatchModal(false)}
        onSubmit={handleQuickDispatchSubmit}
        customers={allCustomers || []}
        vehicles={availableVehicles || []}
        drivers={availableDrivers || []}
      />
    </div>
  );
};

// ============================================================================
// Shipment Card Component
// ============================================================================

interface ShipmentCardProps {
  shipment: Shipment;
  onClick: () => void;
  isCustomerRequest?: boolean;
}

const ShipmentCard = ({ shipment, onClick, isCustomerRequest }: ShipmentCardProps) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{shipment.shipmentNumber}</h3>
            {isCustomerRequest && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                Yeu cau tu KH
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{shipment.customer?.name}</p>
        </div>
        <PriorityBadge priority={shipment.priority} />
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>
          {formatDate(shipment.plannedStartDate)} - {formatDate(shipment.plannedEndDate)}
        </p>
        <p>{shipment.stops.length} stops</p>
        <p className="truncate">
          {shipment.stops
            .slice(0, 2)
            .map((stop) => stop.locationName)
            .join(' -> ')}
          {shipment.stops.length > 2 && '...'}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Priority Badge
// ============================================================================

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    LOW: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded font-medium ${styles[priority] || styles.NORMAL}`}>
      {priority}
    </span>
  );
};

// ============================================================================
// Dispatch Assignment Modal (existing shipment -> assign vehicle + driver)
// ============================================================================

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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900">{shipment.shipmentNumber}</h3>
              <PriorityBadge priority={shipment.priority} />
              {shipment.createdByType === 'CUSTOMER' && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                  KH
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{shipment.customer?.name}</p>
            <p className="text-sm text-gray-600">{shipment.stops.length} stops</p>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate} - {vehicle.vehicleType.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
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
          <Button variant="ghost" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedVehicle || !selectedDriver || isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign Dispatch'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Quick Dispatch Modal (create shipment + dispatch in one step)
// ============================================================================

interface QuickDispatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customers: CustomerItem[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

interface StopFormData {
  stopType: string;
  locationName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  plannedArrival: string;
  plannedDeparture: string;
}

const emptyStop = (): StopFormData => ({
  stopType: 'PICKUP',
  locationName: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  plannedArrival: '',
  plannedDeparture: '',
});

const QuickDispatchModal = ({
  open,
  onClose,
  onSubmit,
  customers,
  vehicles,
  drivers,
}: QuickDispatchModalProps) => {
  const [customerId, setCustomerId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [containerType, setContainerType] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [stops, setStops] = useState<StopFormData[]>([
    { ...emptyStop(), stopType: 'PICKUP' },
    { ...emptyStop(), stopType: 'DROPOFF' },
  ]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCustomers = (customers || []).filter((c: CustomerItem) => c.status === 'ACTIVE');

  const resetForm = () => {
    setCustomerId('');
    setPriority('NORMAL');
    setPlannedStartDate('');
    setPlannedEndDate('');
    setContainerNumber('');
    setContainerType('');
    setSpecialInstructions('');
    setStops([
      { ...emptyStop(), stopType: 'PICKUP' },
      { ...emptyStop(), stopType: 'DROPOFF' },
    ]);
    setVehicleId('');
    setDriverId('');
    setDispatchNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateStop = (index: number, field: keyof StopFormData, value: string) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const addStop = () => {
    setStops([...stops, { ...emptyStop(), stopType: 'DROPOFF' }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== index));
  };

  const isValid =
    customerId &&
    plannedStartDate &&
    plannedEndDate &&
    vehicleId &&
    driverId &&
    stops.every((s) => s.locationName && s.address && s.plannedArrival && s.plannedDeparture);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerId,
        priority,
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: new Date(plannedEndDate),
        containerNumber: containerNumber || undefined,
        containerType: containerType || undefined,
        specialInstructions: specialInstructions || undefined,
        stops: stops.map((s, i) => ({
          sequence: i + 1,
          stopType: s.stopType,
          locationName: s.locationName,
          address: s.address,
          contactPerson: s.contactPerson || undefined,
          contactPhone: s.contactPhone || undefined,
          plannedArrival: new Date(s.plannedArrival),
          plannedDeparture: new Date(s.plannedDeparture),
        })),
        vehicleId,
        driverId,
        dispatchNotes: dispatchNotes || undefined,
      });
      resetForm();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} closeOnClickOutside={false}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Tao & Dispatch nhanh</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create a new shipment and assign dispatch in one step
          </p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Customer & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khach hang <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">-- Chon khach hang --</option>
                {activeCustomers.map((c: CustomerItem) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Do uu tien
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Planned Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngay bat dau <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngay ket thuc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Container Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                So container
              </label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g. MSKU1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loai container
              </label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">-- Chon loai --</option>
                <option value="CONTAINER_20FT">Container 20ft</option>
                <option value="CONTAINER_40FT">Container 40ft</option>
                <option value="CONTAINER_40HC">Container 40ft HC</option>
                <option value="CONTAINER_45FT">Container 45ft</option>
                <option value="FLATBED">Flatbed</option>
                <option value="TANK">Tank</option>
                <option value="REFRIGERATED">Refrigerated</option>
                <option value="OPEN_TOP">Open Top</option>
              </select>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeu cau dac biet
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              placeholder="Ghi chu yeu cau dac biet..."
            />
          </div>

          {/* Stops */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Diem dung <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addStop}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Them diem dung
              </button>
            </div>
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Diem #{index + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={stop.stopType}
                        onChange={(e) => updateStop(index, 'stopType', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="PICKUP">Pickup</option>
                        <option value="DROPOFF">Dropoff</option>
                        <option value="DEPOT">Depot</option>
                        <option value="PORT">Port</option>
                      </select>
                      {stops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Xoa
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={stop.locationName}
                        onChange={(e) => updateStop(index, 'locationName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Ten dia diem *"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={stop.address}
                        onChange={(e) => updateStop(index, 'address', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Dia chi *"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={stop.contactPerson}
                        onChange={(e) => updateStop(index, 'contactPerson', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Nguoi lien he"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={stop.contactPhone}
                        onChange={(e) => updateStop(index, 'contactPhone', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="So dien thoai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Den *</label>
                      <input
                        type="datetime-local"
                        value={stop.plannedArrival}
                        onChange={(e) => updateStop(index, 'plannedArrival', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Di *</label>
                      <input
                        type="datetime-local"
                        value={stop.plannedDeparture}
                        onChange={(e) => updateStop(index, 'plannedDeparture', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle & Driver Assignment */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Phan cong</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xe <span className="text-red-500">*</span>
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Chon xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} - {v.vehicleType.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tai xe <span className="text-red-500">*</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Chon tai xe --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dispatch Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chu dispatch
            </label>
            <textarea
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              placeholder="Ghi chu cho tai xe..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Huy
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Dang tao...' : 'Tao & Dispatch'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
