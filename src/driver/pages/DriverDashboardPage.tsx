import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import {
  getDriverTasksByDriver,
  updateDriverTaskStatus,
} from 'wasp/client/operations';
import { StopCheckInOut } from '../components/StopCheckInOut';

interface DriverTask {
  id: string;
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
    operationStatus?: string;
    customer: { name: string };
    stops: Array<{
      id: string;
      sequence: number;
      stopType: string;
      stopCategory?: string;
      locationName: string;
      address: string;
      contactPerson?: string;
      contactPhone?: string;
      plannedArrival: string;
      plannedDeparture: string;
      actualArrival?: string;
      actualDeparture?: string;
      requiredPhotos: string[];
    }>;
    pods?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      photoCategory?: string;
      stopId?: string;
    }>;
  };
  tractor: { licensePlate: string };
  trailer?: { licensePlate: string } | null;
}

const taskStatusStyles: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  COMPLETED: 'bg-green-100 text-green-800 border-green-400',
  SKIPPED: 'bg-red-100 text-red-700 border-red-300',
};

export const DriverDashboardPage = () => {
  const { data: tasks, isLoading, refetch } = useQuery(getDriverTasksByDriver, {});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const handleStartTrip = async (taskId: string) => {
    try {
      await updateDriverTaskStatus({
        taskId,
        status: 'IN_PROGRESS',
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Khong the bat dau chuyen');
    }
  };

  const handleCompleteTrip = async (taskId: string) => {
    if (!confirm('Xac nhan hoan thanh chuyen nay?')) return;

    try {
      await updateDriverTaskStatus({
        taskId,
        status: 'COMPLETED',
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Khong the hoan thanh chuyen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Dang tai...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = [...(tasks || [])].sort((a: DriverTask, b: DriverTask) => a.sequence - b.sequence);
  const activeTasks = sortedTasks.filter((t: DriverTask) => t.status === 'IN_PROGRESS');
  const pendingTasks = sortedTasks.filter((t: DriverTask) => t.status === 'PENDING');
  const completedTasks = sortedTasks.filter((t: DriverTask) => ['COMPLETED', 'SKIPPED'].includes(t.status));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Chuyen cua toi</h1>
          <p className="text-gray-600 mt-1">Danh sach cong viec duoc phan cong</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {sortedTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <p className="text-gray-600 mb-2">Chua co chuyen nao</p>
            <p className="text-sm text-gray-500">Ban se thay cac chuyen duoc phan cong o day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  Dang thuc hien ({activeTasks.length})
                </h2>
                <div className="space-y-4">
                  {activeTasks.map((task: DriverTask) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isExpanded={expandedTask === task.id}
                      onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      onStartTrip={() => handleStartTrip(task.id)}
                      onCompleteTrip={() => handleCompleteTrip(task.id)}
                      onUpdate={refetch}
                      isActive
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                  Cho xu ly ({pendingTasks.length})
                </h2>
                <div className="space-y-4">
                  {pendingTasks.map((task: DriverTask) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isExpanded={expandedTask === task.id}
                      onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      onStartTrip={() => handleStartTrip(task.id)}
                      onCompleteTrip={() => handleCompleteTrip(task.id)}
                      onUpdate={refetch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  Hoan thanh ({completedTasks.length})
                </h2>
                <div className="space-y-4">
                  {completedTasks.map((task: DriverTask) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isExpanded={expandedTask === task.id}
                      onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      onStartTrip={() => {}}
                      onCompleteTrip={() => {}}
                      onUpdate={refetch}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Task Card
// ============================================================================

interface TaskCardProps {
  task: DriverTask;
  isExpanded: boolean;
  isActive?: boolean;
  onToggle: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onUpdate: () => void;
}

const TaskCard = ({ task, isExpanded, isActive, onToggle, onStartTrip, onCompleteTrip, onUpdate }: TaskCardProps) => {
  const stops = [...task.shipment.stops].sort((a, b) => a.sequence - b.sequence);
  const allStopsCompleted = stops.every(s => s.actualDeparture);

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${
      isActive ? 'ring-2 ring-yellow-400' : ''
    }`}>
      {/* Card Header */}
      <div
        onClick={onToggle}
        className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{task.shipment.shipmentNumber}</h3>
              {task.shipment.shipmentType && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  task.shipment.shipmentType === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {task.shipment.shipmentType}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                taskStatusStyles[task.status] || taskStatusStyles.PENDING
              }`}>
                {task.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{task.shipment.customer.name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Dau keo: {task.tractor.licensePlate}</span>
              {task.trailer && <span>Mooc: {task.trailer.licensePlate}</span>}
            </div>
            {task.instructions && (
              <p className="text-sm text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded">
                {task.instructions}
              </p>
            )}
          </div>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content: Stops */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Diem dung ({stops.length})</h4>
            {stops.map((stop) => (
              <StopCheckInOut
                key={stop.id}
                stop={stop}
                taskId={task.id}
                shipmentId={task.shipment.id}
                pods={task.shipment.pods || []}
                onUpdate={onUpdate}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            {task.status === 'PENDING' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartTrip(); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bat dau chuyen
              </button>
            )}

            {task.status === 'IN_PROGRESS' && allStopsCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onCompleteTrip(); }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Hoan thanh chuyen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
