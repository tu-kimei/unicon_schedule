import { useState } from "react";
import { twJoin } from "tailwind-merge";

interface ImageUploadProps {
  label?: string;
  error?: string;
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  required?: boolean;
}

export function ImageUpload({
  label,
  error,
  value = [],
  onChange,
  maxFiles = 5,
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previewUrls.length + files.length > maxFiles) {
      alert(`Chỉ được tải lên tối đa ${maxFiles} ảnh`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const newUrls = [...previewUrls, ...data.urls];
      setPreviewUrls(newUrls);
      onChange?.(newUrls);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
    onChange?.(newUrls);
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
        {/* Preview Images */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="group relative">
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
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {previewUrls.length < maxFiles && (
          <label
            className={twJoin(
              "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary-500 hover:bg-gray-50",
              uploading && "cursor-not-allowed opacity-50",
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
              {uploading ? "Đang tải lên..." : "Nhấn để tải ảnh lên"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              ({previewUrls.length}/{maxFiles} ảnh)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
