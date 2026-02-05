import { useState, useEffect } from "react";
import { twJoin } from "tailwind-merge";

interface LocalImageUploadProps {
  label?: string;
  error?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  existingImages?: string[]; // URLs of existing images
  onRemoveExisting?: (url: string) => void; // Callback to remove existing image
  maxFiles?: number;
  required?: boolean;
}

export function LocalImageUpload({
  label,
  error,
  value = [],
  onChange,
  existingImages = [],
  onRemoveExisting,
  maxFiles = 5,
  required = false,
}: LocalImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Calculate total images (existing + new)
  const totalImages = existingImages.length + value.length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (totalImages + files.length > maxFiles) {
      alert(`Chỉ được tải lên tối đa ${maxFiles} ảnh`);
      return;
    }

    // Create preview URLs
    const newPreviewUrls = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    const updatedFiles = [...value, ...files];
    const updatedPreviews = [...previewUrls, ...newPreviewUrls];
    
    setPreviewUrls(updatedPreviews);
    onChange?.(updatedFiles);
  };

  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setPreviewUrls(newPreviews);
    onChange?.(newFiles);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Existing Images + New Preview Images */}
        {(existingImages.length > 0 || previewUrls.length > 0) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="group relative">
                <img
                  src={url}
                  alt={`Existing ${index + 1}`}
                  className="h-24 w-full rounded-md border border-gray-300 object-cover"
                />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(url)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
                <div className="absolute bottom-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                  Đã lưu
                </div>
              </div>
            ))}
            
            {/* New Preview Images */}
            {previewUrls.map((url, index) => (
              <div key={`new-${index}`} className="group relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-full rounded-md border border-gray-300 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 rounded bg-green-500 px-1.5 py-0.5 text-xs text-white">
                  Mới
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {totalImages < maxFiles && (
          <label
            className={twJoin(
              "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-500 hover:bg-gray-50",
            )}
          >
            <svg
              className="mb-2 h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm text-gray-600">
              Nhấn để chọn ảnh
            </span>
            <span className="mt-1 text-xs text-gray-500">
              ({totalImages}/{maxFiles} ảnh)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
