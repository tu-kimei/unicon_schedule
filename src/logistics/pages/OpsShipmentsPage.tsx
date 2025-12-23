import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllShipments } from 'wasp/client/operations';
import { ShipmentCard } from '../components/ShipmentCard';

interface ShipmentFilters {
  status?: string;
  priority?: string;
  dateRange?: { start?: Date; end?: Date };
}

export const OpsShipmentsPage = () => {
  const [filters, setFilters] = useState<ShipmentFilters>({});
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  // Use Wasp's useQuery hook
  const { data: shipments, isLoading, error } = useQuery(getAllShipments, filters);

  const handleShipmentClick = (shipment: any) => {
    // Navigate to shipment details or show modal
    console.log('Selected shipment:', shipment);
    setSelectedShipment(shipment);
  };

  const handleCreateShipment = () => {
    // Navigate to create shipment page
    console.log('Create new shipment');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading shipments: {error.message}</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
              <p className="text-gray-600">Manage orders and shipments</p>
            </div>
            <button
              onClick={handleCreateShipment}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create Shipment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                status: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="READY">Ready</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priority: e.target.value || undefined
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <input
              type="date"
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value) : undefined;
                setFilters(prev => ({
                  ...prev,
                  dateRange: start ? { ...prev.dateRange, start } : undefined
                }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Start Date"
            />

            <input
              type="date"
              onChange={(e) => {
                const end = e.target.value ? new Date(e.target.value) : undefined;
                setFilters(prev => ({
                  ...prev,
                  dateRange: end ? { ...prev.dateRange, end } : undefined
                }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Shipments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : shipments && shipments.length > 0 ? (
            shipments.map((shipment: any) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onClick={handleShipmentClick}
                showActions={true}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No shipments found</p>
              <p className="text-gray-400">Try adjusting your filters or create a new shipment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
