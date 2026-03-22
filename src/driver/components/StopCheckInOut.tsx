import { useState } from 'react';
import { updateDriverTaskStatus } from 'wasp/client/operations';
import { PhotoUpload } from './PhotoUpload';

interface Stop {
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
}

interface StopCheckInOutProps {
  stop: Stop;
  taskId: string;
  shipmentId: string;
  pods: Array<{ id: string; fileName: string; filePath: string; photoCategory?: string; stopId?: string }>;
  onUpdate: () => void;
}

const stopCategoryLabels: Record<string, string> = {
  PICKUP_EMPTY: 'Lấy container rỗng',
  WAREHOUSE_LOAD: 'Đóng hàng tại kho',
  PORT_DELIVERY: 'Hạ container tại cảng',
  PORT_PICKUP: 'Lấy hàng tại cảng',
  WAREHOUSE_UNLOAD: 'Dỡ hàng tại kho',
  RETURN_EMPTY: 'Trả container rỗng',
};

export const StopCheckInOut = ({ stop, taskId, shipmentId, pods, onUpdate }: StopCheckInOutProps) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const stopPods = pods.filter(p => p.stopId === stop.id);
  const isCheckedIn = !!stop.actualArrival;
  const isCheckedOut = !!stop.actualDeparture;

  // Check if all required photos have been uploaded for this stop
  const hasAllRequiredPhotos = stop.requiredPhotos.every(category =>
    stopPods.some(p => p.photoCategory === category)
  );

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await updateDriverTaskStatus({
        taskId,
        status: 'IN_PROGRESS',
        stopUpdates: [{
          stopId: stop.id,
          actualArrival: new Date(),
        }],
      });
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Check-in thất bại');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasAllRequiredPhotos) {
      alert('Vui lòng tải đủ ảnh bắt buộc trước khi check-out');
      return;
    }

    setIsCheckingOut(true);
    try {
      await updateDriverTaskStatus({
        taskId,
        status: 'IN_PROGRESS',
        stopUpdates: [{
          stopId: stop.id,
          actualDeparture: new Date(),
        }],
      });
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Check-out thất bại');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${
      isCheckedOut ? 'border-green-200 bg-green-50' :
      isCheckedIn ? 'border-blue-200 bg-blue-50' :
      'border-gray-200 bg-white'
    }`}>
      {/* Stop Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">#{stop.sequence}</span>
            <h4 className="font-medium text-gray-900">{stop.locationName}</h4>
          </div>
          <p className="text-sm text-gray-600">{stop.address}</p>
          <div className="flex gap-2 mt-1">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
              {stop.stopType}
            </span>
            {stop.stopCategory && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {stopCategoryLabels[stop.stopCategory] || stop.stopCategory}
              </span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div>
          {isCheckedOut ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              Hoàn thành
            </span>
          ) : isCheckedIn ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Đang xử lý
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              Chưa đến
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      {(stop.contactPerson || stop.contactPhone) && (
        <div className="mb-3 text-sm text-gray-600">
          Liên hệ: {stop.contactPerson} {stop.contactPhone && (
            <a href={`tel:${stop.contactPhone}`} className="text-primary-600 underline">{stop.contactPhone}</a>
          )}
        </div>
      )}

      {/* Times */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <span className="text-gray-500">Dự kiến đến:</span>
          <p className="font-medium">{new Date(stop.plannedArrival).toLocaleString('vi-VN')}</p>
          {stop.actualArrival && (
            <p className="text-green-700 font-medium">
              Thực tế: {new Date(stop.actualArrival).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
        <div>
          <span className="text-gray-500">Dự kiến rời:</span>
          <p className="font-medium">{new Date(stop.plannedDeparture).toLocaleString('vi-VN')}</p>
          {stop.actualDeparture && (
            <p className="text-green-700 font-medium">
              Thực tế: {new Date(stop.actualDeparture).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      {/* Photo uploads (show after check-in, before check-out) */}
      {isCheckedIn && !isCheckedOut && stop.requiredPhotos.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">Ảnh bắt buộc:</p>
          {stop.requiredPhotos.map((category) => (
            <PhotoUpload
              key={category}
              shipmentId={shipmentId}
              stopId={stop.id}
              photoCategory={category}
              existingPhotos={stopPods}
              onUploadComplete={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Check-in / Check-out buttons */}
      <div className="flex gap-2">
        {!isCheckedIn && (
          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className="flex-1 bg-primary-600 hover:bg-primary-700 transition-colors duration-200 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isCheckingIn ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            )}
            Đã đến
          </button>
        )}

        {isCheckedIn && !isCheckedOut && (
          <button
            onClick={handleCheckOut}
            disabled={isCheckingOut || !hasAllRequiredPhotos}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            Đã rời
          </button>
        )}
      </div>

      {isCheckedIn && !isCheckedOut && !hasAllRequiredPhotos && (
        <p className="text-xs text-amber-600 mt-2">
          Tải đủ ảnh bắt buộc để hoàn thành điểm dừng
        </p>
      )}
    </div>
  );
};
