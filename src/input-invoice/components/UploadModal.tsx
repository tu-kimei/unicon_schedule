import { useState, useRef } from 'react';
import { Modal } from '../../debt/components/Modal';

type Company = 'KHANH_HUY' | 'UNICON';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadDone: (data: {
    company: Company;
    fileUrls: string[];
    fileNames: string[];
    mimeTypes: string[];
    fileSizes: number[];
  }) => void;
}

export const UploadModal = ({ isOpen, onClose, onUploadDone }: UploadModalProps) => {
  const [company, setCompany] = useState<Company>('UNICON');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFiles([]);
    setError(null);
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Vui lòng chọn ít nhất 1 file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('company', company);
      files.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/input-invoices/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      onUploadDone({
        company,
        fileUrls: data.urls,
        fileNames: data.fileNames,
        mimeTypes: data.mimeTypes,
        fileSizes: data.fileSizes,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📤 Upload chứng từ đầu vào">
      <div className="space-y-4">
        {/* Company Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Công ty *</label>
          <div className="flex gap-3">
            {[
              { value: 'KHANH_HUY' as Company, label: 'Khánh Huy' },
              { value: 'UNICON' as Company, label: 'Unicon' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCompany(opt.value)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  company === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file (ảnh/PDF)</label>
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-600">Kéo thả hoặc click để chọn file</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, PDF — Max 10MB/file</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">{files.length} file đã chọn</div>
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg">{file.type.includes('pdf') ? '📄' : '🖼️'}</span>
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Huỷ
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang upload...
              </span>
            ) : (
              `Upload ${files.length} file`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
