import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getInputInvoices, exportInputInvoices, createInputInvoice } from 'wasp/client/operations';
import { RoleGuard } from '../../shared/components/RoleGuard';
import { Button } from '../../shared/components/Button';
import { UploadModal } from '../components/UploadModal';
import { DetailPanel } from '../components/DetailPanel';
import type { InputInvoiceRecord, VehicleCompany, InputInvoiceStatus } from '../types';

type Company = 'KHANH_HUY' | 'UNICON' | '';
type Status = InputInvoiceStatus | '';

const statusLabels: Record<InputInvoiceStatus, string> = {
  PROCESSING: 'Đang xử lý',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ERROR: 'Lỗi',
};

const statusColors: Record<InputInvoiceStatus, string> = {
  PROCESSING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  ERROR: 'bg-red-100 text-red-700',
};

function formatDate(d?: string | Date | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('vi-VN');
}

function formatCurrency(n?: number | string | null) {
  if (n === null || n === undefined || n === '') return '-';
  return Number(n).toLocaleString('vi-VN');
}

export const InputInvoicesPage = () => {
  const [company, setCompany] = useState<Company>('');
  const [status, setStatus] = useState<Status>('');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<InputInvoiceRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(getInputInvoices, {
    company: company || undefined,
    status: status || undefined,
    search: search || undefined,
    page: 1,
    limit: 100,
  });

  const handleUploadDone = async (payload: {
    company: VehicleCompany;
    fileUrls: string[];
    fileNames: string[];
    mimeTypes: string[];
    fileSizes: number[];
  }) => {
    try {
      await createInputInvoice(payload);
      refetch();
    } catch (e: any) {
      alert(`Lỗi tạo chứng từ: ${e.message}`);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportInputInvoices({
        company: company || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export lỗi: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const invoices: InputInvoiceRecord[] = data?.invoices || [];
  const summary = data?.summary || { total: 0, processing: 0, pending: 0, confirmed: 0, error: 0 };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ACCOUNTING']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Hoá đơn đầu vào</h1>
                <p className="text-sm text-gray-600">Quản lý chứng từ mua hàng của KHANH_HUY và UNICON</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExport} disabled={exporting} variant="ghost" size="sm">
                  {exporting ? '...' : '📊 Export Excel'}
                </Button>
                <Button onClick={() => setUploadOpen(true)} size="sm">+ Upload</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Tổng', value: summary.total, color: 'bg-gray-100 text-gray-700' },
              { label: 'Đang xử lý', value: summary.processing, color: 'bg-blue-100 text-blue-700' },
              { label: 'Chờ xác nhận', value: summary.pending, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Đã xác nhận', value: summary.confirmed, color: 'bg-green-100 text-green-700' },
              { label: 'Lỗi', value: summary.error, color: 'bg-red-100 text-red-700' },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-lg p-3 ${s.color}`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo số HĐ, ký hiệu, NCC..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:outline-none focus:ring-2"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Công ty</label>
                <select value={company} onChange={(e) => setCompany(e.target.value as Company)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Tất cả</option>
                  <option value="KHANH_HUY">Khánh Huy</option>
                  <option value="UNICON">Unicon</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Tất cả</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="ERROR">Lỗi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-2" />
              <p className="text-gray-600">Đang tải...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Lỗi: {error.message}</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công ty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số HĐ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NCC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày HĐ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng TT</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">File</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(inv)}>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.company}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-primary-600">{inv.invoiceNumber || '-'}</div>
                          {inv.invoiceSymbol && <div className="text-xs text-gray-500">{inv.invoiceSymbol}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.supplierName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          {inv.fileUrls.length > 0 && (
                            <div className="flex justify-center gap-1">
                              {inv.fileUrls.slice(0, 3).map((url, i) => (
                                <img key={i} src={url} alt="" className="w-8 h-8 object-cover rounded" />
                              ))}
                              {inv.fileUrls.length > 3 && <span className="text-xs text-gray-500">+{inv.fileUrls.length - 3}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${statusColors[inv.status]}`}>
                            {statusLabels[inv.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(inv); }}
                            className="px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} onClick={() => setSelected(inv)} className="p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900">{inv.supplierName || inv.invoiceNumber || 'Chưa có thông tin'}</div>
                        <div className="text-xs text-gray-500">{inv.company}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(inv.invoiceDate)}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(inv.totalAmount)} VND</span>
                    </div>
                  </div>
                ))}
              </div>

              {invoices.length === 0 && (
                <div className="p-8 text-center text-gray-500">Không có chứng từ nào</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadDone={handleUploadDone}
      />

      {/* Detail Side Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <DetailPanel invoice={selected} onClose={() => setSelected(null)} onUpdate={() => { refetch(); setSelected(null); }} />
        </>
      )}
    </RoleGuard>
  );
};
