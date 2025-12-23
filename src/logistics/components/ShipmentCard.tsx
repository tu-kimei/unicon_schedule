import { StatusBadge } from './StatusBadge';

interface Shipment {
  id: string;
  shipmentNumber: string;
  currentStatus: string;
  priority: string;
  plannedStartDate: string;
  stops: Array<{ id: string; sequence: number; stopType: string; locationName: string }>;
  dispatch?: {
    vehicle: { licensePlate: string };
    driver: { user: { fullName: string } };
  };
  order: {
    customer: { name: string };
  };
}

interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: (shipment: Shipment) => void;
  showActions?: boolean;
}

export const ShipmentCard = ({ shipment, onClick, showActions }: ShipmentCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(shipment)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {shipment.shipmentNumber}
          </h3>
          <p className="text-sm text-gray-600">
            Customer: {shipment.order.customer.name}
          </p>
        </div>
        <StatusBadge status={shipment.currentStatus as any} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Priority:</span>
          <span className={`font-medium ${
            shipment.priority === 'URGENT' ? 'text-red-600' :
            shipment.priority === 'HIGH' ? 'text-orange-600' :
            'text-gray-600'
          }`}>
            {shipment.priority}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Stops:</span>
          <span className="font-medium">{shipment.stops.length}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Start Date:</span>
          <span className="font-medium">{formatDate(shipment.plannedStartDate)}</span>
        </div>

        {shipment.dispatch && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium">{shipment.dispatch.vehicle.licensePlate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Driver:</span>
              <span className="font-medium">{shipment.dispatch.driver.user.fullName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
