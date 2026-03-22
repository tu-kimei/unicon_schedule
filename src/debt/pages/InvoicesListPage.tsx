import { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { getAllInvoices, deleteInvoice } from 'wasp/client/operations';
import { Button } from '../../shared/components/Button';

// ============================================================================
// Types & Constants
// ============================================================================

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Nhap',
  SENT: 'Da gui',
  PAID: 'Da thanh toan',
  PARTIAL: 'Thanh toan mot phan',
  OVERDUE: 'Qua han',
  CANCELLED: 'Da huy',
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-500',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorStyles[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-80">{label}</div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

// ============================================================================
// InvoicesListPage
// ============================================================================

export const InvoicesListPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: invoiceData,
    isLoading,
    error,
    refetch,
  } = useQuery(getAllInvoices, {
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const handleDelete = async (invoice: any) => {
    if (invoice.status !== 'DRAFT') {
      alert('Chi co the xoa hoa don o trang thai Nhap');
      return;
    }
    if (!confirm(`Ban co chac chan muon xoa hoa don ${invoice.invoiceNumber}?`)) return;
    try {
      await deleteInvoice({ invoiceId: invoice.id });
      refetch();
    } catch (err: any) {
      alert('Loi: ' + err.message);
    }
  };

  // Filter invoices by search
  const filteredInvoices = useMemo(() => {
    if (!invoiceData?.invoices) return [];
    return invoiceData.invoices;
  }, [invoiceData?.invoices]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Loi: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Quan ly Hoa don</h1>
              <p className="text-sm text-gray-600">Theo doi hoa don khach hang</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Summary Cards */}
        {invoiceData?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Tong" value={invoiceData.summary.total} color="blue" />
            <StatCard label="Nhap" value={invoiceData.summary.draft} color="gray" />
            <StatCard label="Da gui" value={invoiceData.summary.sent} color="yellow" />
            <StatCard label="Da thanh toan" value={invoiceData.summary.paid} color="green" />
            <StatCard label="Qua han" value={invoiceData.summary.overdue} color="red" />
          </div>
        )}

        {/* Search + Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tim theo so hoa don, ten khach hang..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trang thai</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tat ca</option>
                <option value="DRAFT">Nhap</option>
                <option value="SENT">Da gui</option>
                <option value="PAID">Da thanh toan</option>
                <option value="PARTIAL">Thanh toan mot phan</option>
                <option value="OVERDUE">Qua han</option>
                <option value="CANCELLED">Da huy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-2" />
            <p className="text-gray-600">Dang tai...</p>
          </div>
        )}

        {/* Invoices Table */}
        {!isLoading && invoiceData && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      So hoa don
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Khach hang
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Thanh tien
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      VAT
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tong cong
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngay
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Han TT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Hanh dong
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice: any) => (
                    <tr
                      key={invoice.id}
                      onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-primary-600 hover:text-primary-700">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {invoice.customer?.name}
                        </div>
                        {invoice.shipment && (
                          <div className="text-xs text-gray-500">
                            Shipment: {invoice.shipment.shipmentNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">
                        {formatCurrency(Number(invoice.subtotal))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">
                        {formatCurrency(Number(invoice.vatAmount))}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(Number(invoice.grandTotal))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            invoice.status === 'OVERDUE'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-700'
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/accounting/invoices/${invoice.id}`);
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-700 hover:bg-primary-50 rounded"
                          >
                            Xem
                          </button>
                          {invoice.status === 'DRAFT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(invoice);
                              }}
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                            >
                              Xoa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredInvoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-primary-600">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-900 truncate">
                        {invoice.customer?.name}
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className="font-bold text-gray-900 tabular-nums">
                        {formatCurrency(Number(invoice.grandTotal))}
                      </div>
                      <div className="text-xs text-gray-500">VND</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <InvoiceStatusBadge status={invoice.status} />
                    {invoice.shipment && (
                      <span className="text-xs text-gray-500">
                        {invoice.shipment.shipmentNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Ngay: {formatDate(invoice.invoiceDate)}</span>
                    <span>Han: {formatDate(invoice.dueDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/accounting/invoices/${invoice.id}`);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-center text-primary-700 bg-primary-50 hover:bg-primary-100 rounded"
                    >
                      Xem
                    </button>
                    {invoice.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(invoice);
                        }}
                        className="flex-1 py-1.5 text-xs font-medium text-center text-red-600 bg-red-50 hover:bg-red-100 rounded"
                      >
                        Xoa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {filteredInvoices.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-600">Khong co hoa don nao</p>
              </div>
            )}

            {/* Result count */}
            {filteredInvoices.length > 0 && (
              <div className="text-center text-sm text-gray-500 py-3 border-t">
                Hien thi {filteredInvoices.length} hoa don
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
