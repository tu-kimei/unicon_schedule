# UI Design v0.1 (M1)

## Tổng quan

UI design cho Milestone M1 - Core Operations. Focus vào:
- Ops: Shipment management
- Dispatcher: Dispatch assignment & tracking
- Shared: Status updates & POD upload

**Tech Stack**: React + TypeScript + Wasp components

## 1. Shared Components

### StatusBadge Component
```tsx
interface StatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const colors = {
    DRAFT: 'gray',
    READY: 'blue',
    ASSIGNED: 'yellow',
    IN_TRANSIT: 'orange',
    COMPLETED: 'green',
    CANCELLED: 'red'
  };

  return (
    <span className={`badge badge-${colors[status]} badge-${size}`}>
      {status}
    </span>
  );
};
```

### ShipmentCard Component
```tsx
interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: (shipment: Shipment) => void;
  showActions?: boolean;
}

const ShipmentCard = ({ shipment, onClick, showActions }: ShipmentCardProps) => {
  return (
    <div className="card" onClick={() => onClick?.(shipment)}>
      <div className="card-header">
        <h3>{shipment.shipmentNumber}</h3>
        <StatusBadge status={shipment.currentStatus} />
      </div>

      <div className="card-body">
        <p>Priority: {shipment.priority}</p>
        <p>Stops: {shipment.stops.length}</p>
        <p>Start: {formatDate(shipment.plannedStartDate)}</p>

        {shipment.dispatch && (
          <div className="dispatch-info">
            <p>Vehicle: {shipment.dispatch.vehicle.licensePlate}</p>
            <p>Driver: {shipment.dispatch.driver.fullName}</p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="card-actions">
          {/* Action buttons based on user role & status */}
        </div>
      )}
    </div>
  );
};
```

## 2. Ops Pages

### 2.1 Shipment List Page (`/ops/shipments`)

**Purpose**: Dashboard view of all shipments for Ops management

**State Management**:
```tsx
interface ShipmentListState {
  shipments: Shipment[];
  loading: boolean;
  filters: {
    status?: ShipmentStatus;
    priority?: Priority;
    dateRange?: { start: Date; end: Date };
  };
  selectedShipment?: Shipment;
}
```

**Component Structure**:
```tsx
const OpsShipmentListPage = () => {
  const [state, setState] = useState<ShipmentListState>({
    shipments: [],
    loading: true,
    filters: {}
  });

  // Load shipments on mount
  useEffect(() => {
    loadShipments();
  }, [state.filters]);

  const loadShipments = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const shipments = await query(getAllShipments, state.filters);
      setState(prev => ({ ...prev, shipments, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showError('Failed to load shipments');
    }
  };

  return (
    <div className="ops-shipments">
      <Header>
        <h1>Shipment Management</h1>
        <Button onClick={() => navigate('/ops/shipments/create')}>
          Create Shipment
        </Button>
      </Header>

      <Filters
        filters={state.filters}
        onChange={(filters) => setState(prev => ({ ...prev, filters }))}
      />

      <div className="shipment-grid">
        {state.loading ? (
          <LoadingSpinner />
        ) : (
          state.shipments.map(shipment => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onClick={(shipment) => navigate(`/ops/shipments/${shipment.id}`)}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

**Actions Available**:
- Filter by status, priority, date
- Create new shipment
- View shipment details
- Edit shipment (if DRAFT/READY)

### 2.2 Create Shipment Page (`/ops/shipments/create`)

**Purpose**: Multi-step form to create new shipment

**State Management**:
```tsx
interface CreateShipmentState {
  step: 1 | 2 | 3; // Basic Info -> Stops -> Review
  form: {
    orderId: string;
    priority: Priority;
    plannedStartDate: Date;
    plannedEndDate: Date;
    stops: ShipmentStopInput[];
  };
  orders: Order[];
  submitting: boolean;
}
```

**Component Structure**:
```tsx
const CreateShipmentPage = () => {
  const [state, setState] = useState<CreateShipmentState>({
    step: 1,
    form: {
      orderId: '',
      priority: 'NORMAL',
      plannedStartDate: new Date(),
      plannedEndDate: new Date(),
      stops: []
    },
    orders: [],
    submitting: false
  });

  // Load available orders
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const orders = await query(getAvailableOrders);
    setState(prev => ({ ...prev, orders }));
  };

  const handleNext = () => {
    if (state.step < 3) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 }));
    }
  };

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, submitting: true }));
    try {
      await action(createShipment, state.form);
      navigate('/ops/shipments');
      showSuccess('Shipment created successfully');
    } catch (error) {
      showError('Failed to create shipment');
    } finally {
      setState(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="create-shipment">
      <Stepper currentStep={state.step} steps={['Basic Info', 'Stops', 'Review']} />

      {state.step === 1 && (
        <BasicInfoStep
          form={state.form}
          orders={state.orders}
          onChange={(updates) => setState(prev => ({
            ...prev,
            form: { ...prev.form, ...updates }
          }))}
        />
      )}

      {state.step === 2 && (
        <StopsStep
          stops={state.form.stops}
          onChange={(stops) => setState(prev => ({
            ...prev,
            form: { ...prev.form, stops }
          }))}
        />
      )}

      {state.step === 3 && (
        <ReviewStep
          form={state.form}
          submitting={state.submitting}
          onSubmit={handleSubmit}
        />
      )}

      <div className="form-actions">
        {state.step > 1 && (
          <Button onClick={() => setState(prev => ({
            ...prev,
            step: (prev.step - 1) as 1 | 2 | 3
          }))}>
            Back
          </Button>
        )}

        {state.step < 3 && (
          <Button onClick={handleNext} disabled={!isStepValid(state.step, state.form)}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};
```

## 3. Dispatcher Pages

### 3.1 Dispatch Dashboard (`/dispatcher/dashboard`)

**Purpose**: View pending shipments and assign vehicles/drivers

**State Management**:
```tsx
interface DispatchDashboardState {
  pendingShipments: Shipment[];
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
  selectedShipment?: Shipment;
  loading: boolean;
}
```

**Component Structure**:
```tsx
const DispatchDashboardPage = () => {
  const [state, setState] = useState<DispatchDashboardState>({
    pendingShipments: [],
    availableVehicles: [],
    availableDrivers: [],
    loading: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [pendingShipments, availableVehicles, availableDrivers] = await Promise.all([
        query(getPendingShipments),
        query(getAvailableVehicles),
        query(getAvailableDrivers)
      ]);

      setState(prev => ({
        ...prev,
        pendingShipments,
        availableVehicles,
        availableDrivers,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showError('Failed to load dashboard data');
    }
  };

  const handleAssignDispatch = async (shipmentId: string, vehicleId: string, driverId: string) => {
    try {
      await action(createDispatch, {
        shipmentId,
        vehicleId,
        driverId
      });

      // Refresh data
      await loadData();
      showSuccess('Dispatch assigned successfully');
    } catch (error) {
      showError('Failed to assign dispatch');
    }
  };

  return (
    <div className="dispatch-dashboard">
      <Header>
        <h1>Dispatch Dashboard</h1>
      </Header>

      <div className="dashboard-grid">
        <div className="pending-shipments">
          <h2>Pending Shipments ({state.pendingShipments.length})</h2>
          {state.pendingShipments.map(shipment => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onClick={(shipment) => setState(prev => ({ ...prev, selectedShipment: shipment }))}
            />
          ))}
        </div>

        <div className="resources">
          <div className="available-vehicles">
            <h3>Available Vehicles ({state.availableVehicles.length})</h3>
            {state.availableVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>

          <div className="available-drivers">
            <h3>Available Drivers ({state.availableDrivers.length})</h3>
            {state.availableDrivers.map(driver => (
              <DriverCard key={driver.id} driver={driver} />
            ))}
          </div>
        </div>
      </div>

      {state.selectedShipment && (
        <DispatchModal
          shipment={state.selectedShipment}
          vehicles={state.availableVehicles}
          drivers={state.availableDrivers}
          onAssign={handleAssignDispatch}
          onClose={() => setState(prev => ({ ...prev, selectedShipment: undefined }))}
        />
      )}
    </div>
  );
};
```

### 3.2 Dispatch Modal Component

```tsx
interface DispatchModalProps {
  shipment: Shipment;
  vehicles: Vehicle[];
  drivers: Driver[];
  onAssign: (shipmentId: string, vehicleId: string, driverId: string) => Promise<void>;
  onClose: () => void;
}

const DispatchModal = ({ shipment, vehicles, drivers, onAssign, onClose }: DispatchModalProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedVehicle || !selectedDriver) return;

    setAssigning(true);
    try {
      await onAssign(shipment.id, selectedVehicle, selectedDriver);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal title="Assign Dispatch" onClose={onClose}>
      <div className="dispatch-assignment">
        <div className="shipment-info">
          <h3>Shipment {shipment.shipmentNumber}</h3>
          <p>Stops: {shipment.stops.length}</p>
          <p>Priority: {shipment.priority}</p>
        </div>

        <div className="assignment-form">
          <div className="form-group">
            <label>Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate} - {vehicle.vehicleType}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Driver</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.driverCode} - {driver.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedVehicle || !selectedDriver || assigning}
          >
            {assigning ? 'Assigning...' : 'Assign Dispatch'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

## 4. Shared Features

### 4.1 Status Update Flow

**Universal Component** for status updates from any page:

```tsx
interface StatusUpdateProps {
  shipment: Shipment;
  onStatusUpdated: (shipment: Shipment) => void;
}

const StatusUpdate = ({ shipment, onStatusUpdated }: StatusUpdateProps) => {
  const [updating, setUpdating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const validTransitions = getValidTransitions(shipment.currentStatus);

  const handleStatusUpdate = async (newStatus: ShipmentStatus, description: string) => {
    setUpdating(true);
    try {
      await action(updateShipmentStatus, {
        shipmentId: shipment.id,
        status: newStatus,
        description,
        location: getCurrentLocation() // GPS or manual
      });

      // Reload shipment data
      const updatedShipment = await query(getShipment, { id: shipment.id });
      onStatusUpdated(updatedShipment);

      setModalOpen(false);
      showSuccess('Status updated successfully');
    } catch (error) {
      showError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        Update Status
      </Button>

      <StatusUpdateModal
        open={modalOpen}
        shipment={shipment}
        validTransitions={validTransitions}
        onUpdate={handleStatusUpdate}
        onClose={() => setModalOpen(false)}
        updating={updating}
      />
    </>
  );
};
```

### 4.2 POD Upload Component

```tsx
interface PODUploadProps {
  shipment: Shipment;
  onPODUploaded: (pod: POD) => void;
}

const PODUpload = ({ shipment, onPODUploaded }: PODUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedStop, setSelectedStop] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const pod = await action(uploadPOD, {
        shipmentId: shipment.id,
        file,
        fileName: file.name,
        fileType: getFileType(file.type),
        stopId: selectedStop || undefined
      });

      onPODUploaded(pod);
      showSuccess('POD uploaded successfully');
    } catch (error) {
      showError('Failed to upload POD');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pod-upload">
      <h4>Upload POD</h4>

      <div className="upload-form">
        <div className="form-group">
          <label>Attach to Stop (Optional)</label>
          <select
            value={selectedStop}
            onChange={(e) => setSelectedStop(e.target.value)}
          >
            <option value="">General POD</option>
            {shipment.stops.map(stop => (
              <option key={stop.id} value={stop.id}>
                Stop {stop.sequence}: {stop.locationName}
              </option>
            ))}
          </select>
        </div>

        <FileUpload
          accept="image/jpeg,image/png,application/pdf"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={handleFileUpload}
          uploading={uploading}
        />
      </div>
    </div>
  );
};
```

## 5. Navigation & Layout

### App Layout Component
```tsx
const AppLayout = ({ children }: { children: ReactNode }) => {
  const user = useAuth();

  const navigation = {
    ops: [
      { path: '/ops/shipments', label: 'Shipments' },
      { path: '/ops/orders', label: 'Orders' }
    ],
    dispatcher: [
      { path: '/dispatcher/dashboard', label: 'Dashboard' },
      { path: '/dispatcher/shipments', label: 'All Shipments' }
    ]
  };

  return (
    <div className="app-layout">
      <Sidebar>
        <nav>
          {navigation[user.role]?.map(item => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </Sidebar>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
```

## 6. State Management Patterns

### Global State (Context)
```tsx
interface AppContextType {
  user: User;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Custom hooks for common queries
export const useShipments = (filters?: ShipmentFilters) => {
  return useQuery(getShipments, filters);
};

export const useShipment = (id: string) => {
  return useQuery(getShipment, { id });
};
```

### Form State Management
```tsx
// Reusable form hook
const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const setTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, values[field]);
  };

  const validateField = (field: keyof T, value: any) => {
    // Field validation logic
  };

  return { values, errors, touched, setValue, setTouched };
};
```

## Notes

- **Component Structure**: Functional components with hooks
- **State Management**: Local state + global context for shared data
- **Data Fetching**: Wasp queries for server state
- **Actions**: Wasp actions for mutations
- **Error Handling**: Toast notifications for user feedback
- **Loading States**: Spinners and disabled states during async operations
- **Responsive**: Mobile-first design considerations
