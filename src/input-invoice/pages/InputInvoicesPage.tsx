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

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

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

function makeMonthString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export const InputInvoicesPage = () => {
  const [company, setCompany] = useState<Company>('');
  const [status, setStatus] = useState<Status>('');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<InputInvoiceRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterQuarter, setFilterQuarter] = useState<string>('');
  const [dateFilterType, setDateFilterType] = useState<'invoice' | 'upload'>('invoice');

  const invoiceMonth = (() => {
    if (filterMonth && filterYear && !filterQuarter) {
      return makeMonthString(parseInt(filterYear), parseInt(filterMonth));
    }
    return undefined;
  })();

  const uploadMonth = (() => {
    if (dateFilterType === 'upload' && filterMonth && filterYear && !filterQuarter) {
      return makeMonthString(parseInt(filterYear), parseInt(filterMonth));
    }
    return undefined;
  })();

  const adjustedInvoiceMonth = dateFilterType === 'invoice' ? invoiceMonth : undefined;
  const adjustedUploadMonth = dateFilterType === 'upload' ? invoiceMonth : undefined;

  const quarter = filterQuarter && filterYear ? parseInt(filterQuarter) : undefined;
  const year = filterYear ? parseInt(filterYear) : undefined;

  const { data, isLoading, error, refetch } = useQuery(getInputInvoices, {
    company: company || undefined,
    status: status || undefined,
    search: search || undefined,
    invoiceMonth: adjustedInvoiceMonth,
    uploadMonth: adjustedUploadMonth,
    quarter: quarter || undefined,
    year: year || undefined,
    page,
    limit: PAGE_SIZE,
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
        invoiceMonth: adjustedInvoiceMonth,
        uploadMonth: adjustedUploadMonth,
        quarter: quarter || undefined,
        year: year || undefined,
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

  const resetFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterQuarter('');
    setDateFilterType('invoice');
  };

  const hasActiveFilter = !!(filterYear || filterMonth || filterQuarter);

  const invoices: InputInvoiceRecord[] = data?.invoices || [];
  const summary = data?.summary || { total: 0, processing: 0, pending: 0, confirmed: 0, error: 0 };
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          {/* Summary Cards — toàn bộ dataset */}
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Công ty</label>
                <select value={company} onChange={(e) => { setCompany(e.target.value as Company); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Tất cả</option>
                  <option value="KHANH_HUY">Khánh Huy</option>
                  <option value="UNICON">Unicon</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value as Status); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Tất cả</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="ERROR">Lỗi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại ngày</label>
                <select value={dateFilterType} onChange={(e) => setDateFilterType(e.target.value as 'invoice' | 'upload')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="invoice">Ngày hoá đơn</option>
                  <option value="upload">Ngày upload</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
                <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setFilterQuarter(''); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Tất cả</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
                <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterQuarter(''); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={!filterYear}>
                  <option value="">Tất cả</option>
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={String(m)}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quý</label>
                <select value={filterQuarter} onChange={(e) => { setFilterQuarter(e.target.value); setFilterMonth(''); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={!filterYear}>
                  <option value="">Tất cả</option>
                  <option value="1">Q1 (T1-T3)</option>
                  <option value="2">Q2 (T4-T6)</option>
                  <option value="3">Q3 (T7-T9)</option>
                  <option value="4">Q4 (T10-T12)</option>
                </select>
              </div>
            </div>

            {hasActiveFilter && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Đang lọc:</span>
                {filterYear && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Năm {filterYear}</span>}
                {filterMonth && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Tháng {filterMonth}</span>}
                {filterQuarter && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Q{filterQuarter}</span>}
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {dateFilterType === 'invoice' ? 'theo ngày HĐ' : 'theo ngày upload'}
                </span>
                <button onClick={resetFilters} className="text-red-500 hover:text-red-700 ml-2">✕ Xoá filter</button>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-2" />
              <p className="text-gray-600">Đang tải...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Lỗi: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
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

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
              <div className="text-sm text-gray-600">
                Trang {page}/{totalPages} · Tổng {pagination?.total ?? 0} chứng từ
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  «
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  ‹ Trước
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1 text-sm rounded border ${p === page ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  Sau ›
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  »
                </button>
              </div>
            </div>
          )}
          {!isLoading && !error && pagination && (
            <div className="text-xs text-gray-400 text-right">
              {PAGE_SIZE} chứng từ/trang
            </div>
          )}
        </div>
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadDone={handleUploadDone}
      />

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <DetailPanel invoice={selected} onClose={() => setSelected(null)} onUpdate={() => { refetch(); setSelected(null); }} />
        </>
      )}
    </RoleGuard>
  );
};
