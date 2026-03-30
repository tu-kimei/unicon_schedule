import { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { RoleGuard } from '../../shared/components/RoleGuard';
import {
  getPendingShipments,
  getAvailableVehicles,
  getAvailableDrivers,
  getAllCustomers,
  getDriverTasks,
  createDriverTask,
  createAndDispatchShipment,
} from 'wasp/client/operations';
import { Dialog } from '../../shared/components/Dialog';
import { Button } from '../../shared/components/Button';

// ============================================================================
// Types
// ============================================================================

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
  createdAt: string;
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
  defaultTractor?: Vehicle | null;
  defaultTrailer?: Vehicle | null;
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

// ============================================================================
// Stop templates for quick dispatch
// ============================================================================

const STOP_TEMPLATES: Record<string, { stopType: string; stopCategory: string; label: string }[]> = {
  EXPORT: [
    { stopType: 'DEPOT', stopCategory: 'PICKUP_EMPTY', label: 'Lấy container rỗng' },
    { stopType: 'PICKUP', stopCategory: 'WAREHOUSE_LOAD', label: 'Đóng hàng tại kho' },
    { stopType: 'PORT', stopCategory: 'PORT_DELIVERY', label: 'Giao tại cảng' },
  ],
  IMPORT: [
    { stopType: 'PORT', stopCategory: 'PORT_PICKUP', label: 'Lấy hàng tại cảng' },
    { stopType: 'DROPOFF', stopCategory: 'WAREHOUSE_UNLOAD', label: 'Dỡ hàng tại kho' },
    { stopType: 'DEPOT', stopCategory: 'RETURN_EMPTY', label: 'Trả container rỗng' },
  ],
};

// ============================================================================
// Main Page
// ============================================================================

export const DispatcherDashboardPage = () => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuickDispatchModal, setShowQuickDispatchModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data
  const { data: pendingShipments, isLoading: shipmentsLoading, refetch: refetchShipments } = useQuery(getPendingShipments);
  const { data: availableVehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useQuery(getAvailableVehicles);
  const { data: availableDrivers, isLoading: driversLoading, refetch: refetchDrivers } = useQuery(getAvailableDrivers);
  const { data: allCustomers } = useQuery(getAllCustomers);
  const { data: allDriverTasks, refetch: refetchTasks } = useQuery(getDriverTasks, {});

  // Today's active tasks per driver
  const todayTasksByDriver = useMemo(() => {
    const grouped: Record<string, DriverTaskItem[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    (allDriverTasks || []).forEach((task: DriverTaskItem) => {
      if (!grouped[task.driverId]) {
        grouped[task.driverId] = [];
      }
      grouped[task.driverId].push(task);
    });
    return grouped;
  }, [allDriverTasks]);

  // All pending shipments (DRAFT/READY)
  const allPending = useMemo(
    () => (pendingShipments || []) as Shipment[],
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
      const driverTasks = todayTasksByDriver[data.driverId] || [];
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
      setSuccessMessage('Phân công tài xế thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      refetchAll();
    } catch (error: any) {
      console.error('Failed to create driver task:', error);
      alert(error?.message || 'Không thể phân công tài xế. Vui lòng thử lại.');
    }
  };

  const handleQuickDispatchSubmit = async (data: any) => {
    await createAndDispatchShipment(data);
    setShowQuickDispatchModal(false);
    setSuccessMessage('Tạo và điều phối chuyến hàng thành công!');
    setTimeout(() => setSuccessMessage(null), 4000);
    refetchAll();
  };

  const isLoading = shipmentsLoading || vehiclesLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div className="min-h-screen bg-gray-50">
        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Bảng điều phối</h1>
                <p className="text-gray-600 text-sm mt-1">Phân công tài xế và quản lý chuyến</p>
              </div>
              <Button
                onClick={() => setShowQuickDispatchModal(true)}
                className="cursor-pointer transition-colors duration-200"
              >
                + Tạo & Điều phối nhanh
              </Button>
            </div>
          </div>
        </div>

        {/* Main 2-column layout: 60% / 40% */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left side (60%): Chuyến chờ điều phối */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chuyến chờ điều phối ({allPending.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">Nhấn "Gán tài xế" để phân công</p>
              </div>
              <div className="px-6 py-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                {allPending.length > 0 ? (
                  <div className="space-y-3">
                    {allPending.map((shipment: Shipment) => (
                      <PendingShipmentCard
                        key={shipment.id}
                        shipment={shipment}
                        onAssign={() => handleShipmentClick(shipment)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">Không có chuyến chờ điều phối</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side (40%): Danh sách tài xế */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Danh sách tài xế
                </h2>
              </div>
              <div className="px-4 py-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                {(availableDrivers || []).length > 0 ? (
                  <div className="space-y-2">
                    {(availableDrivers as DriverItem[] || []).map((driver) => {
                      const driverTasks = todayTasksByDriver[driver.id] || [];
                      const activeTasks = driverTasks.filter(
                        (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
                      );
                      const isAvailable = activeTasks.length === 0;

                      return (
                        <div
                          key={driver.id}
                          className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {driver.fullName}
                              </span>
                              {driver.defaultTractor && (
                                <span className="text-xs text-gray-500">
                                  ({driver.defaultTractor.licensePlate})
                                </span>
                              )}
                            </div>
                            {driverTasks.length > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {driverTasks.map(t => t.shipment.shipmentNumber).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {isAvailable ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Rảnh
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Đang chạy ({activeTasks.length} chuyến)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Không có tài xế</p>
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
    </RoleGuard>
  );
};

// ============================================================================
// Pending Shipment Card
// ============================================================================

interface PendingShipmentCardProps {
  shipment: Shipment;
  onAssign: () => void;
}

const PendingShipmentCard = ({ shipment, onAssign }: PendingShipmentCardProps) => {
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
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900">{shipment.shipmentNumber}</h3>
            {shipment.shipmentType && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                shipment.shipmentType === 'EXPORT'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {shipment.shipmentType === 'EXPORT' ? 'Xuất' : 'Nhập'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{shipment.customer?.name}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer transition-colors duration-200 flex-shrink-0"
        >
          Gán tài xế
        </button>
      </div>
      <div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap">
        <span>{shipment.stops.length} điểm dừng</span>
        <span>{formatDate(shipment.createdAt || shipment.plannedStartDate)}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Assign Driver Task Modal (simplified)
// ============================================================================

interface AssignDriverTaskModalProps {
  shipment: Shipment;
  vehicles: Vehicle[];
  drivers: DriverItem[];
  onAssign: (data: { driverId: string; tractorId: string; trailerId?: string; instructions?: string }) => Promise<void>;
  onClose: () => void;
}

const AssignDriverTaskModal = ({ shipment, vehicles, drivers, onAssign, onClose }: AssignDriverTaskModalProps) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTractor, setSelectedTractor] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const tractors = vehicles.filter(v => v.vehicleType === 'TRACTOR');
  const trailers = vehicles.filter(v => v.vehicleType === 'TRAILER');

  // When driver changes, auto-fill default vehicles
  const handleDriverChange = (driverId: string) => {
    setSelectedDriver(driverId);
    if (driverId) {
      const driver = drivers.find(d => d.id === driverId);
      if (driver?.defaultTractor) {
        setSelectedTractor(driver.defaultTractor.id);
      } else {
        setSelectedTractor('');
      }
      if (driver?.defaultTrailer) {
        setSelectedTrailer(driver.defaultTrailer.id);
      } else {
        setSelectedTrailer('');
      }
    } else {
      setSelectedTractor('');
      setSelectedTrailer('');
    }
  };

  const selectedDriverObj = drivers.find(d => d.id === selectedDriver);

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
          <h2 className="text-xl font-semibold text-gray-900">Phân công tài xế</h2>
          <p className="text-sm text-gray-500 mt-1">
            {shipment.shipmentNumber} - {shipment.customer?.name}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tài xế <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200"
            >
              <option value="">-- Chọn tài xế --</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}{driver.defaultTractor ? ` - ${driver.defaultTractor.licensePlate}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle info (auto-filled from driver defaults) */}
          {selectedDriver && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đầu kéo <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTractor}
                  onChange={(e) => setSelectedTractor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200"
                >
                  <option value="">-- Chọn đầu kéo --</option>
                  {tractors.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rơ moóc
                </label>
                <select
                  value={selectedTrailer}
                  onChange={(e) => setSelectedTrailer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200"
                >
                  <option value="">-- Không chọn --</option>
                  {trailers.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate}</option>
                  ))}
                </select>
              </div>

              {selectedDriverObj?.defaultTractor && (
                <p className="text-xs text-gray-500">
                  Xe mặc định của tài xế. Thay đổi nếu cần.
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              placeholder="Ghi chú cho tài xế..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} disabled={isAssigning} className="cursor-pointer transition-colors duration-200">
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTractor || !selectedDriver || isAssigning}
            className="cursor-pointer transition-colors duration-200"
          >
            {isAssigning ? 'Đang phân công...' : 'Phân công'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Quick Dispatch Modal (simplified - 5 fields)
// ============================================================================

interface QuickDispatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customers: CustomerItem[];
  vehicles: Vehicle[];
  drivers: DriverItem[];
}

const QuickDispatchModal = ({
  open,
  onClose,
  onSubmit,
  customers,
  vehicles,
  drivers,
}: QuickDispatchModalProps) => {
  const [customerId, setCustomerId] = useState('');
  const [shipmentType, setShipmentType] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [driverId, setDriverId] = useState('');
  const [tractorId, setTractorId] = useState('');
  const [trailerId, setTrailerId] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeCustomers = (customers || []).filter((c) => c.status === 'ACTIVE');
  const tractors = vehicles.filter((v) => v.vehicleType === 'TRACTOR');
  const trailers = vehicles.filter((v) => v.vehicleType === 'TRAILER');

  // When driver changes, auto-fill default vehicles
  const handleDriverChange = (newDriverId: string) => {
    setDriverId(newDriverId);
    if (newDriverId) {
      const driver = drivers.find(d => d.id === newDriverId);
      if (driver?.defaultTractor) {
        setTractorId(driver.defaultTractor.id);
      } else {
        setTractorId('');
      }
      if (driver?.defaultTrailer) {
        setTrailerId(driver.defaultTrailer.id);
      } else {
        setTrailerId('');
      }
    } else {
      setTractorId('');
      setTrailerId('');
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setShipmentType('EXPORT');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setDriverId('');
    setTractorId('');
    setTrailerId('');
    setContainerNumber('');
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValid = customerId && selectedDate && driverId && tractorId;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const template = STOP_TEMPLATES[shipmentType];

      await onSubmit({
        customerId,
        shipmentType,
        priority: 'NORMAL',
        plannedStartDate: startOfDay,
        plannedEndDate: endOfDay,
        containerNumber: containerNumber || undefined,
        stops: template.map((t, i) => ({
          sequence: i + 1,
          stopType: t.stopType,
          stopCategory: t.stopCategory,
          locationName: '',
          address: '',
          plannedArrival: startOfDay,
          plannedDeparture: endOfDay,
        })),
        tractorId,
        trailerId: trailerId || undefined,
        driverId,
      });
      resetForm();
    } catch (error: any) {
      const msg = error?.message || error?.data?.message || 'Không thể tạo điều phối. Vui lòng thử lại.';
      setSubmitError(msg);
      console.error('Quick dispatch error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDriverObj = drivers.find(d => d.id === driverId);

  return (
    <Dialog open={open} onClose={handleClose} closeOnClickOutside={false}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Tạo & Điều phối nhanh</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tạo chuyến hàng mới và phân công trong một bước
          </p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* 1. Khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200"
            >
              <option value="">-- Chọn khách hàng --</option>
              {activeCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Loại vận chuyển */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại vận chuyển <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShipmentType('EXPORT')}
                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-colors duration-200 ${
                  shipmentType === 'EXPORT'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Hàng xuất</div>
                <div className="text-xs text-gray-500 mt-1">Lấy rỗng &rarr; Kho &rarr; Cảng</div>
              </button>
              <button
                type="button"
                onClick={() => setShipmentType('IMPORT')}
                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-colors duration-200 ${
                  shipmentType === 'IMPORT'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Hàng nhập</div>
                <div className="text-xs text-gray-500 mt-1">Cảng &rarr; Kho &rarr; Trả rỗng</div>
              </button>
            </div>
          </div>

          {/* 3. Ngày */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* 4. Tài xế */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tài xế <span className="text-red-500">*</span>
            </label>
            <select
              value={driverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200"
            >
              <option value="">-- Chọn tài xế --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}{d.defaultTractor ? ` (${d.defaultTractor.licensePlate})` : ''}
                </option>
              ))}
            </select>

            {/* Auto-filled vehicle info */}
            {driverId && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 w-20">Đầu kéo:</label>
                  <select
                    value={tractorId}
                    onChange={(e) => setTractorId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer transition-colors duration-200"
                  >
                    <option value="">-- Chọn --</option>
                    {tractors.map((v) => (
                      <option key={v.id} value={v.id}>{v.licensePlate}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 w-20">Rơ moóc:</label>
                  <select
                    value={trailerId}
                    onChange={(e) => setTrailerId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer transition-colors duration-200"
                  >
                    <option value="">-- Không chọn --</option>
                    {trailers.map((v) => (
                      <option key={v.id} value={v.id}>{v.licensePlate}</option>
                    ))}
                  </select>
                </div>
                {selectedDriverObj?.defaultTractor && (
                  <p className="text-xs text-gray-400">
                    Xe mặc định của tài xế. Thay đổi nếu cần.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 5. Số container */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số container
            </label>
            <input
              type="text"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="VD: MSKU1234567"
            />
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between sticky bottom-0 bg-white">
          <div className="text-xs text-gray-400">
            {!isValid && 'Vui lòng điền đầy đủ các trường bắt buộc (*)'}
          </div>
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="cursor-pointer transition-colors duration-200">
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="cursor-pointer transition-colors duration-200">
              {isSubmitting ? 'Đang tạo...' : 'Tạo & Điều phối'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
