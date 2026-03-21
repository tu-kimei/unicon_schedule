import { useState, useRef } from 'react';
import { uploadPOD } from 'wasp/client/operations';

interface PhotoUploadProps {
  shipmentId: string;
  stopId: string;
  photoCategory: string;
  existingPhotos: Array<{ id: string; fileName: string; filePath: string; photoCategory?: string }>;
  onUploadComplete: () => void;
}

const photoCategoryLabels: Record<string, string> = {
  CONTAINER_EXTERIOR: 'Mặt ngoài container',
  CONTAINER_INTERIOR: 'Mặt trong container',
  PORT_GATE_PASS: 'Phiếu ra/vào cảng',
  WAREHOUSE_GATE_PASS: 'Phiếu ra/vào kho',
  WEIGHT_TICKET: 'Phiếu cân xe',
  OTHER: 'Khác',
};

export const PhotoUpload = ({
  shipmentId,
  stopId,
  photoCategory,
  existingPhotos,
  onUploadComplete,
}: PhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categoryPhotos = existingPhotos.filter(p => p.photoCategory === photoCategory);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file JPG, PNG hoặc PDF');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileType = file.type === 'image/jpeg' ? 'IMAGE_JPG' :
                       file.type === 'image/png' ? 'IMAGE_PNG' : 'DOCUMENT_PDF';

      await uploadPOD({
        shipmentId,
        stopId,
        file: file as any,
        fileName: file.name,
        fileType: fileType as any,
        photoCategory: photoCategory as any,
      });

      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Tải lên thất bại');
    } finally {
      setIsUploading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {photoCategoryLabels[photoCategory] || photoCategory}
        </span>
        {categoryPhotos.length > 0 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
            {categoryPhotos.length} ảnh
          </span>
        )}
      </div>

      {/* Existing photos */}
      {categoryPhotos.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {categoryPhotos.map((photo) => (
            <div key={photo.id} className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
              {photo.filePath.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={photo.filePath} alt={photo.fileName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2">
        {/* Camera capture */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Chụp ảnh
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Tải ảnh lên
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {isUploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Đang tải lên...
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
