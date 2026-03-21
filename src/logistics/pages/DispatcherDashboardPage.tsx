import { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getPendingShipments,
  getAvailableVehicles,
  getAvailableDrivers,
  getAllCustomers,
  getDriverTasks,
  createDriverTask,
  updateDriverTaskSequence,
  createAndDispatchShipment,
} from 'wasp/client/operations';
import { Dialog } from '../../shared/components/Dialog';
import { Button } from '../../shared/components/Button';

interface Shipment {
  id: string;
  shipmentNumber: string;
  shipmentType?: string | null;
  priority: string;
  currentStatus: string;
  operationStatus?: string;
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

interface DriverItem {
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

interface DriverTaskItem {
  id: string;
  driverId: string;
  sequence: number;
  status: string;
  instructions?: string;
  startedAt?: string;
  completedAt?: string;
  driver: { id: string; fullName: string; user: { fullName: string } };
  shipment: {
    id: string;
    shipmentNumber: string;
    shipmentType?: string;
    customer: { name: string };
    stops: Array<{ locationName: string; stopType: string }>;
  };
  tractor: { licensePlate: string };
  trailer?: { licensePlate: string } | null;
}

export const DispatcherDashboardPage = () => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuickDispatchModal, setShowQuickDispatchModal] = useState(false);

  // Fetch data
  const { data: pendingShipments, isLoading: shipmentsLoading, refetch: refetchShipments } = useQuery(getPendingShipments);
  const { data: availableVehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useQuery(getAvailableVehicles);
  const { data: availableDrivers, isLoading: driversLoading, refetch: refetchDrivers } = useQuery(getAvailableDrivers);
  const { data: allCustomers } = useQuery(getAllCustomers);
  const { data: allDriverTasks, refetch: refetchTasks } = useQuery(getDriverTasks, {});

  // Group driver tasks by driver
  const tasksByDriver = useMemo(() => {
    const grouped: Record<string, { driver: DriverTaskItem['driver']; tasks: DriverTaskItem[] }> = {};
    (allDriverTasks || []).forEach((task: DriverTaskItem) => {
      if (!grouped[task.driverId]) {
        grouped[task.driverId] = { driver: task.driver, tasks: [] };
      }
      grouped[task.driverId].tasks.push(task);
    });
    // Sort tasks by sequence within each driver
    Object.values(grouped).forEach(group => {
      group.tasks.sort((a, b) => a.sequence - b.sequence);
    });
    return grouped;
  }, [allDriverTasks]);

  // Separate customer requests from internal shipments
  const customerRequests = useMemo(
    () => (pendingShipments || []).filter(
      (s: Shipment) => s.createdByType === 'CUSTOMER' && s.currentStatus === 'DRAFT'
    ),
    [pendingShipments]
  );

  const internalPending = useMemo(
    () => (pendingShipments || []).filter(
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
    refetchTasks();
  };

  const handleAssignDriverTask = async (data: {
    driverId: string;
    tractorId: string;
    trailerId?: string;
    instructions?: string;
  }) => {
    if (!selectedShipment) return;

    try {
      // Determine sequence: max current sequence for this driver + 1
      const driverTasks = tasksByDriver[data.driverId]?.tasks || [];
      const maxSeq = driverTasks.reduce((max, t) => Math.max(max, t.sequence), 0);

      await createDriverTask({
        shipmentId: selectedShipment.id,
        driverId: data.driverId,
        tractorId: data.tractorId,
        trailerId: data.trailerId,
        sequence: maxSeq + 1,
        instructions: data.instructions,
      });

      setShowAssignModal(false);
      setSelectedShipment(null);
      refetchAll();
    } catch (error: any) {
      console.error('Failed to create driver task:', error);
      alert(error?.message || 'Failed to assign driver task. Please try again.');
    }
  };

  const handleReorderTasks = async (driverId: string, reorderedTasks: DriverTaskItem[]) => {
    try {
      await updateDriverTaskSequence({
        tasks: reorderedTasks.map((t, i) => ({ id: t.id, sequence: i + 1 })),
      });
      refetchTasks();
    } catch (error: any) {
      console.error('Failed to reorder tasks:', error);
      alert(error?.message || 'Failed to reorder tasks.');
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
              <p className="text-gray-600">Phan cong tai xe va quan ly chuyen</p>
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
            </div>
            <div className="px-6 py-4 max-h-72 overflow-y-auto">
              <div className="space-y-3">
                {customerRequests.map((shipment: Shipment) => (
                  <PendingShipmentCard
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
          {/* Left Panel: Pending Shipments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Chuyen cho dispatch ({internalPending.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Click de phan cong tai xe</p>
            </div>
            <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
              {internalPending.length > 0 ? (
                <div className="space-y-3">
                  {internalPending.map((shipment: Shipment) => (
                    <PendingShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => handleShipmentClick(shipment)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Khong co chuyen cho dispatch</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Driver Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Cong viec tai xe
              </h2>
              <p className="text-sm text-gray-600 mt-1">Keo tha de sap xep thu tu</p>
            </div>
            <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
              {Object.keys(tasksByDriver).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(tasksByDriver).map(([driverId, { driver, tasks }]) => (
                    <DriverTaskGroup
                      key={driverId}
                      driver={driver}
                      tasks={tasks}
                      onReorder={(reordered) => handleReorderTasks(driverId, reordered)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chua co cong viec nao</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Driver Task Modal */}
      {showAssignModal && selectedShipment && (
        <AssignDriverTaskModal
          shipment={selectedShipment}
          vehicles={(availableVehicles || []) as Vehicle[]}
          drivers={(availableDrivers || []) as DriverItem[]}
          onAssign={handleAssignDriverTask}
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
        customers={(allCustomers || []) as CustomerItem[]}
        vehicles={(availableVehicles || []) as Vehicle[]}
        drivers={(availableDrivers || []) as DriverItem[]}
      />
    </div>
  );
};

// ============================================================================
// Pending Shipment Card
// ============================================================================

interface PendingShipmentCardProps {
  shipment: Shipment;
  onClick: () => void;
  isCustomerRequest?: boolean;
}

const PendingShipmentCard = ({ shipment, onClick, isCustomerRequest }: PendingShipmentCardProps) => {
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
            {shipment.shipmentType && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {shipment.shipmentType}
              </span>
            )}
            {isCustomerRequest && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                KH
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{shipment.customer?.name}</p>
        </div>
        <PriorityBadge priority={shipment.priority} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>{formatDate(shipment.plannedStartDate)} - {formatDate(shipment.plannedEndDate)}</p>
        <p>{shipment.stops.length} diem dung</p>
        <p className="truncate">
          {shipment.stops.slice(0, 2).map(s => s.locationName).join(' -> ')}
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
// Driver Task Group (with drag-drop)
// ============================================================================

interface DriverTaskGroupProps {
  driver: DriverTaskItem['driver'];
  tasks: DriverTaskItem[];
  onReorder: (tasks: DriverTaskItem[]) => void;
}

const DriverTaskGroup = ({ driver, tasks, onReorder }: DriverTaskGroupProps) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...tasks];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    setDragIndex(null);
    setDragOverIndex(null);
    onReorder(reordered);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const taskStatusStyles: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    SKIPPED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium text-gray-900">{driver.fullName}</span>
          <span className="text-xs text-gray-500">({tasks.length} chuyen)</span>
        </div>
      </div>

      <div className="p-2 space-y-1">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 px-3 py-2 rounded cursor-grab active:cursor-grabbing transition-colors ${
              dragOverIndex === index ? 'bg-blue-50 border-2 border-blue-300 border-dashed' :
              dragIndex === index ? 'opacity-50 bg-gray-100' :
              'bg-white hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z" />
            </svg>

            <span className="text-xs text-gray-400 w-5">{task.sequence}.</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {task.shipment.shipmentNumber}
                </span>
                {task.shipment.shipmentType && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    task.shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {task.shipment.shipmentType}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {task.shipment.customer.name} | {task.tractor.licensePlate}
                {task.trailer && ` + ${task.trailer.licensePlate}`}
              </p>
              {task.instructions && (
                <p className="text-xs text-blue-600 truncate mt-0.5">{task.instructions}</p>
              )}
            </div>

            <span className={`px-2 py-0.5 text-[10px] rounded font-medium flex-shrink-0 ${
              taskStatusStyles[task.status] || taskStatusStyles.PENDING
            }`}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Assign Driver Task Modal
// ============================================================================

interface AssignDriverTaskModalProps {
  shipment: Shipment;
  vehicles: Vehicle[];
  drivers: DriverItem[];
  onAssign: (data: { driverId: string; tractorId: string; trailerId?: string; instructions?: string }) => Promise<void>;
  onClose: () => void;
}

const AssignDriverTaskModal = ({ shipment, vehicles, drivers, onAssign, onClose }: AssignDriverTaskModalProps) => {
  const [selectedTractor, setSelectedTractor] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const tractors = vehicles.filter(v => v.vehicleType === 'TRACTOR');
  const trailers = vehicles.filter(v => v.vehicleType === 'TRAILER');

  const handleAssign = async () => {
    if (!selectedTractor || !selectedDriver) return;

    setIsAssigning(true);
    try {
      await onAssign({
        driverId: selectedDriver,
        tractorId: selectedTractor,
        trailerId: selectedTrailer || undefined,
        instructions: instructions || undefined,
      });
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
          <h2 className="text-xl font-semibold text-gray-900">Phan cong tai xe</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Shipment Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900">{shipment.shipmentNumber}</h3>
              <PriorityBadge priority={shipment.priority} />
              {shipment.shipmentType && (
                <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                  shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {shipment.shipmentType}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{shipment.customer?.name}</p>
            <p className="text-sm text-gray-600">{shipment.stops.length} diem dung</p>
          </div>

          {/* Tractor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dau keo <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTractor}
              onChange={(e) => setSelectedTractor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">-- Chon dau keo --</option>
              {tractors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate}
                </option>
              ))}
            </select>
          </div>

          {/* Trailer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mooc (Tuy chon)
            </label>
            <select
              value={selectedTrailer}
              onChange={(e) => setSelectedTrailer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">-- Chon mooc --</option>
              {trailers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tai xe <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">-- Chon tai xe --</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chi dan cho tai xe
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Chi dan dac biet cho tai xe..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} disabled={isAssigning}>
            Huy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTractor || !selectedDriver || isAssigning}
          >
            {isAssigning ? 'Dang phan cong...' : 'Phan cong'}
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
  drivers: DriverItem[];
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

  const activeCustomers = (customers || []).filter((c) => c.status === 'ACTIVE');

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
            Tao chuyen hang moi va phan cong trong mot buoc
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
                {activeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Do uu tien</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">So container</label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g. MSKU1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loai container</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeu cau dac biet</label>
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
              <button type="button" onClick={addStop} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Them diem dung
              </button>
            </div>
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Diem #{index + 1}</h4>
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
                        <button type="button" onClick={() => removeStop(index)} className="text-red-500 hover:text-red-700 text-sm">
                          Xoa
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={stop.locationName} onChange={(e) => updateStop(index, 'locationName', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Ten dia diem *" />
                    <input type="text" value={stop.address} onChange={(e) => updateStop(index, 'address', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Dia chi *" />
                    <input type="text" value={stop.contactPerson} onChange={(e) => updateStop(index, 'contactPerson', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Nguoi lien he" />
                    <input type="text" value={stop.contactPhone} onChange={(e) => updateStop(index, 'contactPhone', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="So dien thoai" />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Den *</label>
                      <input type="datetime-local" value={stop.plannedArrival} onChange={(e) => updateStop(index, 'plannedArrival', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Di *</label>
                      <input type="datetime-local" value={stop.plannedDeparture} onChange={(e) => updateStop(index, 'plannedDeparture', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
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
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">-- Chon xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate} - {v.vehicleType.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tai xe <span className="text-red-500">*</span>
                </label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">-- Chon tai xe --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dispatch Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chu dispatch</label>
            <textarea value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} placeholder="Ghi chu cho tai xe..." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>Huy</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Dang tao...' : 'Tao & Dispatch'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
