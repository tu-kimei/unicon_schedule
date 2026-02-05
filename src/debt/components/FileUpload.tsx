import { useState, useRef, useEffect } from 'react';
import { Button } from '../../shared/components/Button';

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

interface FileUploadProps {
  label: string;
  type: 'invoice' | 'payment';
  debtMonth: string;
  onFilesChange: (files: File[]) => void; // New files to upload
  onExistingFilesChange?: (urls: string[]) => void; // When removing existing files
  existingFiles?: string[]; // Existing URLs from server
  maxFiles?: number;
}

export const FileUpload = ({
  label,
  type,
  debtMonth,
  onFilesChange,
  onExistingFilesChange,
  existingFiles = [],
  maxFiles = 10,
}: FileUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [currentExistingFiles, setCurrentExistingFiles] = useState<string[]>(existingFiles);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update existing files when prop changes
  useEffect(() => {
    setCurrentExistingFiles(existingFiles);
  }, [existingFiles]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    const totalFiles = selectedFiles.length + currentExistingFiles.length + files.length;
    if (totalFiles > maxFiles) {
      setError(`Tối đa ${maxFiles} files`);
      return;
    }

    // Validate file size and type
    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" quá lớn. Tối đa 5MB.`);
        return;
      }

      // Check type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG, PDF.`);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newFiles.push({ file, previewUrl });
    }

    setError(null);
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    
    // Notify parent component with File objects
    onFilesChange(updatedFiles.map(item => item.file));

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNew = (index: number) => {
    const fileToRemove = selectedFiles[index];
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(fileToRemove.previewUrl);
    
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    
    // Notify parent
    onFilesChange(updatedFiles.map(item => item.file));
  };

  const handleRemoveExisting = (index: number) => {
    const updatedExisting = currentExistingFiles.filter((_, i) => i !== index);
    setCurrentExistingFiles(updatedExisting);
    
    // Notify parent component
    if (onExistingFilesChange) {
      onExistingFilesChange(updatedExisting);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Upload Area */}
      <div
        onClick={handleClick}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold text-blue-600">Click để chọn file</span> hoặc kéo thả
        </p>
        <p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF (tối đa 5MB)</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Existing Files (Already on Server) */}
      {currentExistingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Đã lưu trên server ({currentExistingFiles.length} files):
          </p>
          <div className="grid grid-cols-2 gap-2">
            {currentExistingFiles.map((url, index) => (
              <div
                key={`existing-${index}`}
                className="relative group border border-green-200 rounded-lg overflow-hidden"
              >
                {/* Image/PDF Preview */}
                {url.match(/\.(jpg|jpeg|png)$/i) ? (
                  <img
                    src={url}
                    alt={`Existing ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-gray-600">PDF</span>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveExisting(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>

                {/* Server Badge */}
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                  Đã lưu
                </div>

                {/* Filename */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {url.split('/').pop()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Selected Files (Not Yet Uploaded) */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Đã chọn ({selectedFiles.length} files) - Chưa upload:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {selectedFiles.map((item, index) => (
              <div
                key={`new-${index}`}
                className="relative group border border-blue-200 rounded-lg overflow-hidden"
              >
                {/* Image/PDF Preview */}
                {item.file.type.startsWith('image/') ? (
                  <img
                    src={item.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-gray-600">PDF</span>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveNew(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>

                {/* Pending Badge */}
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                  Chờ upload
                </div>

                {/* Filename */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {item.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
