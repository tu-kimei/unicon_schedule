import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAvailableOrders, createShipment } from 'wasp/client/operations';

interface Order {
  id: string;
  orderNumber: string;
  customer: { name: string };
}

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: Date;
  plannedDeparture: Date;
  specialInstructions?: string;
}

interface CreateShipmentForm {
  orderId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: Date;
  plannedEndDate: Date;
  stops: ShipmentStopInput[];
}

export const CreateShipmentPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CreateShipmentForm>({
    orderId: '',
    priority: 'NORMAL',
    plannedStartDate: new Date(),
    plannedEndDate: new Date(),
    stops: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available orders
  const { data: orders, isLoading } = useQuery(getAvailableOrders);

  const updateForm = (updates: Partial<CreateShipmentForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const addStop = () => {
    const newSequence = form.stops.length + 1;
    const newStop: ShipmentStopInput = {
      sequence: newSequence,
      stopType: 'PICKUP',
      locationName: '',
      address: '',
      plannedArrival: new Date(),
      plannedDeparture: new Date()
    };
    updateForm({ stops: [...form.stops, newStop] });
  };

  const updateStop = (index: number, updates: Partial<ShipmentStopInput>) => {
    const updatedStops = [...form.stops];
    updatedStops[index] = { ...updatedStops[index], ...updates };
    updateForm({ stops: updatedStops });
  };

  const removeStop = (index: number) => {
    const updatedStops = form.stops.filter((_, i) => i !== index);
    // Re-sequence the stops
    const reSequencedStops = updatedStops.map((stop, i) => ({
      ...stop,
      sequence: i + 1
    }));
    updateForm({ stops: reSequencedStops });
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(form.orderId && form.plannedStartDate && form.plannedEndDate &&
                 form.plannedEndDate > form.plannedStartDate);
      case 2:
        return form.stops.length > 0 && form.stops.every(stop =>
          stop.locationName && stop.address && stop.plannedArrival && stop.plannedDeparture
        );
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createShipment(form);
      // Redirect to shipments list or show success
      console.log('Shipment created successfully');
      // You can use Wasp's navigation here
    } catch (error) {
      console.error('Failed to create shipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center mb-8">
      {['Basic Info', 'Stops', 'Review'].map((label, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;

        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            <span className={`ml-2 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
              {label}
            </span>
            {index < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
          </div>
        );
      })}
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order
        </label>
        <select
          value={form.orderId}
          onChange={(e) => updateForm({ orderId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Select Order</option>
          {orders?.map((order: Order) => (
            <option key={order.id} value={order.id}>
              {order.orderNumber} - {order.customer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={form.priority}
          onChange={(e) => updateForm({ priority: e.target.value as any })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Start Date
          </label>
          <input
            type="datetime-local"
            value={form.plannedStartDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedStartDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned End Date
          </label>
          <input
            type="datetime-local"
            value={form.plannedEndDate.toISOString().slice(0, 16)}
            onChange={(e) => updateForm({ plannedEndDate: new Date(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  const renderStopsStep = () => (
    <div className="space-y-4">
      {form.stops.map((stop, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Stop {stop.sequence}</h3>
            <button
              onClick={() => removeStop(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Type
              </label>
              <select
                value={stop.stopType}
                onChange={(e) => updateStop(index, { stopType: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="PICKUP">Pickup</option>
                <option value="DROPOFF">Dropoff</option>
                <option value="DEPOT">Depot</option>
                <option value="PORT">Port</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={stop.locationName}
                onChange={(e) => updateStop(index, { locationName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Warehouse A"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={stop.address}
                onChange={(e) => updateStop(index, { address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="123 Main St, City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={stop.contactPerson || ''}
                onChange={(e) => updateStop(index, { contactPerson: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={stop.contactPhone || ''}
                onChange={(e) => updateStop(index, { contactPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Arrival
              </label>
              <input
                type="datetime-local"
                value={stop.plannedArrival.toISOString().slice(0, 16)}
                onChange={(e) => updateStop(index, { plannedArrival: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Departure
              </label>
              <input
                type="datetime-local"
                value={stop.plannedDeparture.toISOString().slice(0, 16)}
                onChange={(e) => updateStop(index, { plannedDeparture: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={stop.specialInstructions || ''}
                onChange={(e) => updateStop(index, { specialInstructions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder="Any special handling instructions..."
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addStop}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
      >
        + Add Stop
      </button>
    </div>
  );

  const renderReviewStep = () => {
    const selectedOrder = orders?.find((o: Order) => o.id === form.orderId);

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Shipment Summary</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Order:</span>
              <p>{selectedOrder?.orderNumber} - {selectedOrder?.customer.name}</p>
            </div>
            <div>
              <span className="font-medium">Priority:</span>
              <p>{form.priority}</p>
            </div>
            <div>
              <span className="font-medium">Start Date:</span>
              <p>{form.plannedStartDate.toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium">End Date:</span>
              <p>{form.plannedEndDate.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Stops:</span>
              <p>{form.stops.length} stops</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Stop Details:</h4>
          {form.stops.map((stop, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">Stop {stop.sequence}: {stop.locationName}</h5>
                  <p className="text-sm text-gray-600">{stop.address}</p>
                  <p className="text-sm text-gray-600">{stop.stopType}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{stop.plannedArrival.toLocaleString()}</p>
                  <p>to</p>
                  <p>{stop.plannedDeparture.toLocaleString()}</p>
                </div>
              </div>
              {stop.contactPerson && (
                <p className="text-sm mt-2">
                  Contact: {stop.contactPerson} {stop.contactPhone && `(${stop.contactPhone})`}
                </p>
              )}
              {stop.specialInstructions && (
                <p className="text-sm mt-1 text-gray-600">
                  Instructions: {stop.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
            <p className="text-gray-600">Fill in the shipment details step by step</p>
          </div>

          <div className="px-6 py-6">
            {renderStepIndicator()}

            <div className="mb-8">
              {step === 1 && renderBasicInfoStep()}
              {step === 2 && renderStopsStep()}
              {step === 3 && renderReviewStep()}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                disabled={step === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {step < 3 ? (
                  <button
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    disabled={!validateStep(step)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Shipment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
