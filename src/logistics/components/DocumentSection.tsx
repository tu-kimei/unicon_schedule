import { useState, useRef } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import {
  getShipmentDocuments,
  uploadShipmentDocument,
  verifyDocument,
  deleteDocument,
} from 'wasp/client/operations';
import { getSessionId } from 'wasp/client/api';

// ============================================================================
// Types & Constants
// ============================================================================

type DocumentType =
  | 'BOOKING'
  | 'BILL_OF_LADING'
  | 'CUSTOMS'
  | 'DELIVERY_ORDER'
  | 'PACKING_LIST'
  | 'COMMERCIAL_INVOICE'
  | 'OTHER';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BOOKING: 'Booking',
  BILL_OF_LADING: 'Van don',
  CUSTOMS: 'Hai quan',
  DELIVERY_ORDER: 'Lenh giao hang',
  PACKING_LIST: 'Packing List',
  COMMERCIAL_INVOICE: 'Hoa don thuong mai',
  OTHER: 'Khac',
};

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  BOOKING: 'bg-blue-100 text-blue-800',
  BILL_OF_LADING: 'bg-purple-100 text-purple-800',
  CUSTOMS: 'bg-yellow-100 text-yellow-800',
  DELIVERY_ORDER: 'bg-green-100 text-green-800',
  PACKING_LIST: 'bg-orange-100 text-orange-800',
  COMMERCIAL_INVOICE: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'BOOKING',
  'BILL_OF_LADING',
  'CUSTOMS',
  'DELIVERY_ORDER',
  'PACKING_LIST',
  'COMMERCIAL_INVOICE',
  'OTHER',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// ============================================================================
// Component
// ============================================================================

interface DocumentSectionProps {
  shipmentId: string;
}

export const DocumentSection = ({ shipmentId }: DocumentSectionProps) => {
  const { data: user } = useAuth();
  const {
    data: documents,
    isLoading,
    error,
  } = useQuery(getShipmentDocuments, { shipmentId });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType>('BOOKING');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRole = (user as any)?.role;
  const userId = (user as any)?.id;
  const canUpload = ['ADMIN', 'OPS', 'DISPATCHER', 'CUSTOMER_OPS', 'CUSTOMER_OWNER'].includes(userRole);
  const canVerify = ['ADMIN', 'OPS'].includes(userRole);

  // Group documents by type
  const groupedDocuments = (documents || []).reduce(
    (acc: Record<string, any[]>, doc: any) => {
      const type = doc.documentType as DocumentType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload files to server first
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('category', 'documents');
      formData.append('type', uploadType);

      const sessionId = getSessionId();
      const headers: HeadersInit = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }

      const apiUrl = (import.meta as any).env?.REACT_APP_API_URL || '';
      const uploadUrl = `${apiUrl}/api/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const urls: string[] = data.urls;

      // Create document records via action
      const fileInputs = files.map((file, index) => ({
        fileName: file.name,
        filePath: urls[index],
        fileSize: file.size,
        mimeType: file.type || undefined,
      }));

      await uploadShipmentDocument({
        shipmentId,
        documentType: uploadType,
        files: fileInputs,
        notes: uploadNotes || undefined,
      });

      setShowUploadModal(false);
      setUploadNotes('');
      setUploadType('BOOKING');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Tai tai lieu that bai. Vui long thu lai.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVerify = async (documentId: string) => {
    if (!confirm('Ban co chac chan muon xac minh tai lieu nay?')) return;
    setVerifying(documentId);
    try {
      await verifyDocument({ documentId });
    } catch (err: any) {
      alert(err.message || 'Xac minh that bai');
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Ban co chac chan muon xoa tai lieu nay?')) return;
    setDeleting(documentId);
    try {
      await deleteDocument({ documentId });
    } catch (err: any) {
      alert(err.message || 'Xoa that bai');
    } finally {
      setDeleting(null);
    }
  };

  const canDeleteDoc = (doc: any) => {
    if (doc.isVerified) return false;
    return ['ADMIN', 'OPS'].includes(userRole) || doc.uploadedById === userId;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tai lieu</h2>
        </div>
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tai lieu</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-red-600">Loi: {error.message}</p>
        </div>
      </div>
    );
  }

  const totalDocuments = documents?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tai lieu</h2>
          <p className="text-sm text-gray-500 mt-1">{totalDocuments} tai lieu</p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tai len
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="px-6 py-4">
        {totalDocuments === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-gray-500">Chua co tai lieu nao</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ALL_DOCUMENT_TYPES.map((type) => {
              const docs = groupedDocuments[type];
              if (!docs || docs.length === 0) return null;

              return (
                <div key={type}>
                  <div className="flex items-center mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOCUMENT_TYPE_COLORS[type]}`}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">({docs.length})</span>
                  </div>

                  <div className="space-y-2">
                    {docs.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* File icon */}
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <a
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 truncate block"
                            >
                              {doc.fileName}
                            </a>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>-</span>
                              <span>{doc.uploadedBy?.fullName || 'Unknown'}</span>
                              <span>-</span>
                              <span>{new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {doc.notes && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                          {/* Verified badge */}
                          {doc.isVerified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Da xac minh
                            </span>
                          ) : (
                            <>
                              {canVerify && (
                                <button
                                  onClick={() => handleVerify(doc.id)}
                                  disabled={verifying === doc.id}
                                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
                                >
                                  {verifying === doc.id ? 'Dang...' : 'Xac minh'}
                                </button>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Chua xac minh
                              </span>
                            </>
                          )}

                          {/* Delete button */}
                          {canDeleteDoc(doc) && (
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              className="inline-flex items-center p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Xoa tai lieu"
                            >
                              {deleting === doc.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !uploading && setShowUploadModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tai tai lieu len</h3>

              {/* Document Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loai tai lieu <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as DocumentType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {ALL_DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chu
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ghi chu ve tai lieu..."
                />
              </div>

              {/* File picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chon file <span className="text-red-500">*</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary-500 hover:bg-gray-50 ${
                    uploading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Dang tai len...' : 'Nhan de chon file'}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    PDF, JPG, PNG (max 10MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Dong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
