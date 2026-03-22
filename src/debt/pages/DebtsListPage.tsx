import React, { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { getAllDebts, getAllCustomers, createDebt, updateDebt, markDebtAsPaid, deleteDebt } from 'wasp/client/operations';
import { DebtTypeBadge } from '../components/DebtTypeBadge';
import { DebtStatusBadge } from '../components/DebtStatusBadge';
import { DebtFormModal, type DebtFormData } from '../components/DebtFormModal';
import { MarkAsPaidModal, type PaymentData } from '../components/MarkAsPaidModal';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';
import { getMonthOptions } from '../utils/debtCalculations';

interface PaymentEntry {
  date: string;
  amount: number;
  note: string;
  images: string[];
  runningTotal: number;
}

type DebtStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  FREIGHT: 'Cước vận chuyển',
  ADVANCE: 'Chi hộ',
  OTHER: 'Khác',
};

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' }) {
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

export const DebtsListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    customerId?: string;
    debtMonth?: string;
    status?: DebtStatus;
    isOverdue?: boolean;
  }>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewingImages, setViewingImages] = useState<{ images: string[]; label: string } | null>(null);

  // Fetch debts
  const {
    data: debtsData,
    isLoading,
    error,
    refetch,
  } = useQuery(getAllDebts, {
    ...filters,
    isOverdue: showOverdueOnly || undefined,
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery(getAllCustomers);

  const handleCreateDebt = async (data: DebtFormData) => {
    try {
      await createDebt(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleMarkAsPaid = async (data: PaymentData) => {
    if (!selectedDebt) return;

    try {
      await markDebtAsPaid({
        id: selectedDebt.id,
        ...data,
      });
      setIsPaymentModalOpen(false);
      setSelectedDebt(null);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteDebt = async (debt: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công nợ của "${debt.customer.name}"?`)) return;
    try {
      await deleteDebt({ id: debt.id });
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPaymentHistory = (debt: any): PaymentEntry[] => {
    if (!debt.payments || debt.payments.length === 0) return [];
    let running = 0;
    return debt.payments.map((p: any) => {
      running += Number(p.amount);
      return {
        date: p.paidDate ? new Date(p.paidDate).toISOString() : '',
        amount: Number(p.amount),
        note: p.notes || '',
        images: p.proofImages || [],
        runningTotal: running,
      };
    });
  };

  // Filter debts by search query
  const filteredDebts = useMemo(() => {
    if (!debtsData?.debts) return [];
    if (!searchQuery.trim()) return debtsData.debts;
    const q = searchQuery.toLowerCase().trim();
    return debtsData.debts.filter((debt: any) => {
      const customerName = debt.customer?.name?.toLowerCase() || '';
      const debtMonth = debt.debtMonth?.toLowerCase() || '';
      return customerName.includes(q) || debtMonth.includes(q);
    });
  }, [debtsData?.debts, searchQuery]);

  // Group filtered debts by month
  const groupedDebts = useMemo(() => {
    return filteredDebts.reduce((acc: any, debt: any) => {
      const month = debt.debtMonth;
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(debt);
      return acc;
    }, {});
  }, [filteredDebts]);

  const monthOptions = getMonthOptions();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi: {error.message}</p>
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
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Quản lý Công nợ</h1>
              <p className="text-sm text-gray-600">Theo dõi công nợ khách hàng</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>+ Tạo công nợ mới</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Summary Cards */}
        {debtsData?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={`Tổng công nợ (${formatCurrency(debtsData.summary.totalAmount)} VND)`} value={debtsData.summary.countUnpaid + debtsData.summary.countPaid + debtsData.summary.countOverdue} color="blue" />
            <StatCard label={`Chưa TT (${formatCurrency(debtsData.summary.totalUnpaid)} VND)`} value={debtsData.summary.countUnpaid} color="yellow" />
            <StatCard label={`Đã TT (${formatCurrency(debtsData.summary.totalPaid)} VND)`} value={debtsData.summary.countPaid} color="green" />
            <StatCard label={`Quá hạn (${formatCurrency(debtsData.summary.totalOverdue)} VND)`} value={debtsData.summary.countOverdue} color="red" />
          </div>
        )}

        {/* Search + Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          {/* Search bar */}
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
              placeholder="Tìm theo tên khách hàng, tháng..."
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

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
              <select
                value={filters.debtMonth || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, debtMonth: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Khách hàng</label>
              <select
                value={filters.customerId || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, customerId: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả khách hàng</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: (e.target.value as DebtStatus) || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="OVERDUE">Quá hạn</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOverdueOnly}
                  onChange={(e) => setShowOverdueOnly(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-gray-700">Chỉ hiển thị quá hạn</span>
              </label>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-2" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Debts Table (Desktop) + Cards (Mobile) grouped by month */}
        {!isLoading && debtsData && (
          <div className="space-y-5">
            {Object.keys(groupedDebts)
              .sort()
              .reverse()
              .map((month) => {
                const monthDebts = groupedDebts[month];
                const monthTotal = monthDebts.reduce(
                  (sum: number, d: any) => sum + Number(d.amount),
                  0
                );

                return (
                  <div key={month} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Month header */}
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-900">
                        Tháng {month.split('-')[1]}/{month.split('-')[0]}
                        <span className="text-gray-500 font-normal ml-2 text-sm">
                          ({monthDebts.length} công nợ &middot; {formatCurrency(monthTotal)} VND)
                        </span>
                      </h3>
                    </div>

                    {/* Desktop Table - hidden on mobile */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="w-8 px-2" />
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Khách hàng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Loại
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Số tiền
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Đã TT / Còn lại
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Đến hạn
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Trạng thái
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        {monthDebts.map((debt: any) => (
                          <DebtTableRows
                            key={debt.id}
                            debt={debt}
                            isExpanded={expandedIds.has(debt.id)}
                            onToggleExpand={(e) => toggleExpand(debt.id, e)}
                            onNavigate={() => navigate(`/accounting/debts/${debt.id}`)}
                            onPay={() => { setSelectedDebt(debt); setIsPaymentModalOpen(true); }}
                            onDelete={() => handleDeleteDebt(debt)}
                            onViewImages={(images, label) => setViewingImages({ images, label })}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            getPaymentHistory={getPaymentHistory}
                          />
                        ))}
                      </table>
                    </div>

                    {/* Mobile Card View - visible only on small screens */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {monthDebts.map((debt: any) => {
                        const paidAmt = Number(debt.paidAmount || 0);
                        const debtAmt = Number(debt.amount);
                        const remainAmt = debtAmt - paidAmt;
                        const hasPaid = paidAmt > 0;
                        const paidPct = debtAmt > 0 ? Math.min((paidAmt / debtAmt) * 100, 100) : 0;
                        const isExpanded = expandedIds.has(debt.id);
                        const history = hasPaid ? getPaymentHistory(debt) : [];
                        const canPay = debt.status !== 'PAID' && debt.status !== 'CANCELLED';

                        return (
                          <div
                            key={debt.id}
                            className={`p-4 ${debt.isOverdue ? 'bg-red-50' : ''}`}
                          >
                            {/* Top: customer + amount */}
                            <div
                              onClick={() => navigate(`/accounting/debts/${debt.id}`)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate">{debt.customer.name}</div>
                                </div>
                                <div className="text-right ml-3 flex-shrink-0">
                                  <div className="font-bold text-gray-900 tabular-nums">{formatCurrency(debtAmt)}</div>
                                  <div className="text-xs text-gray-500">VND</div>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <DebtTypeBadge type={debt.debtType} />
                                <DebtStatusBadge status={debt.status} />
                                {debt.isOverdue && (
                                  <span className="text-xs text-red-600 font-medium">Quá hạn {debt.daysOverdue} ngày</span>
                                )}
                              </div>

                              {/* Payment progress (if partial) */}
                              {hasPaid && (
                                <div className="mb-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-green-600">Đã TT: {formatCurrency(paidAmt)}</span>
                                    {remainAmt > 0 && <span className="text-orange-600">Còn: {formatCurrency(remainAmt)}</span>}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${paidPct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                      style={{ width: `${paidPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-500">
                                Đến hạn: {formatDate(debt.dueDate)}
                              </div>
                            </div>

                            {/* Toggle + Actions */}
                            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                              {hasPaid && (
                                <button
                                  onClick={(e) => toggleExpand(debt.id, e)}
                                  className="py-1.5 px-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                                >
                                  <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  {history.length} lần TT
                                </button>
                              )}
                              <div className="flex-1" />
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/accounting/debts/${debt.id}`); }}
                                className="py-1.5 px-3 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded"
                              >
                                Xem
                              </button>
                              {canPay && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedDebt(debt); setIsPaymentModalOpen(true); }}
                                  className="py-1.5 px-3 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded"
                                >
                                  TT
                                </button>
                              )}
                            </div>

                            {/* Expanded history */}
                            {isExpanded && history.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-blue-300 space-y-2">
                                {history.map((entry, idx) => {
                                  const entryDate = entry.date
                                    ? (entry.date.includes('T') ? formatDate(entry.date) : entry.date)
                                    : '-';
                                  const allImages = entry.images || [];
                                  return (
                                    <div key={idx} className="text-xs">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                        <span className="font-medium text-gray-900">+{formatCurrency(entry.amount)} VND</span>
                                        <span className="text-gray-400">{entryDate}</span>
                                        {allImages.length > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewingImages({
                                                images: allImages,
                                                label: `UNC - ${debt.customer.name}`,
                                              });
                                            }}
                                            className="inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 px-2 py-0.5 text-xs hover:bg-blue-200 transition-colors cursor-pointer"
                                          >
                                            Xem UNC
                                          </button>
                                        )}
                                      </div>
                                      {entry.note && <p className="text-gray-500 ml-3.5">{entry.note}</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Empty state */}
            {Object.keys(groupedDebts).length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                {searchQuery ? (
                  <div>
                    <p className="text-gray-600 mb-2">Không tìm thấy công nợ nào phù hợp với "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">Không có công nợ nào</p>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                      Tạo công nợ đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Result count */}
            {filteredDebts.length > 0 && (
              <div className="text-center text-sm text-gray-500 pt-1">
                Hiển thị {filteredDebts.length} công nợ
                {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Debt Modal */}
      <DebtFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDebt}
        customers={customers}
      />

      {/* Mark as Paid Modal */}
      {selectedDebt && (
        <MarkAsPaidModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDebt(null);
          }}
          onSubmit={handleMarkAsPaid}
          debt={selectedDebt}
        />
      )}

      {/* UNC Image Viewer Dialog */}
      {viewingImages && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImages(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">{viewingImages.label}</h3>
              <button
                onClick={() => setViewingImages(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Images */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewingImages.images.map((img, i) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-gray-200 overflow-hidden hover:border-primary-400 transition-colors"
                  >
                    <img
                      src={img}
                      alt={`UNC ${i + 1}`}
                      className="w-full h-auto object-contain max-h-80"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Desktop Table Row Component (avoids Fragment key issue)
// ============================================================================

function DebtTableRows({
  debt,
  isExpanded,
  onToggleExpand,
  onNavigate,
  onPay,
  onDelete,
  onViewImages,
  formatCurrency,
  formatDate,
  getPaymentHistory,
}: {
  debt: any;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onNavigate: () => void;
  onPay: () => void;
  onDelete: () => void;
  onViewImages: (images: string[], label: string) => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: Date | string) => string;
  getPaymentHistory: (d: any) => PaymentEntry[];
}) {
  const paidAmt = Number(debt.paidAmount || 0);
  const debtAmt = Number(debt.amount);
  const remainAmt = debtAmt - paidAmt;
  const hasPaid = paidAmt > 0;
  const paidPct = debtAmt > 0 ? Math.min((paidAmt / debtAmt) * 100, 100) : 0;
  const history = hasPaid ? getPaymentHistory(debt) : [];
  const canPay = debt.status !== 'PAID' && debt.status !== 'CANCELLED';

  return (
    <tbody className="border-b border-gray-200">
      <tr
        onClick={onNavigate}
        className={`cursor-pointer transition-colors ${debt.isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
      >
        <td className="px-2 py-3 text-center">
          {hasPaid && (
            <button onClick={onToggleExpand} className="text-gray-400 hover:text-gray-700 p-0.5" title="Xem lịch sử thanh toán">
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-900">{debt.customer.name}</div>
        </td>
        <td className="px-4 py-3"><DebtTypeBadge type={debt.debtType} /></td>
        <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(debtAmt)}</td>
        <td className="px-4 py-3 text-right">
          {hasPaid ? (
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-green-600 font-medium tabular-nums text-sm">{formatCurrency(paidAmt)}</span>
                <span className="text-gray-400">/</span>
                <span className={`font-medium tabular-nums text-sm ${remainAmt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {remainAmt > 0 ? formatCurrency(remainAmt) : '0'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div className={`h-1.5 rounded-full ${paidPct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="text-sm">{formatDate(debt.dueDate)}</div>
          {debt.isOverdue && <div className="text-xs text-red-600 font-medium">Quá hạn {debt.daysOverdue} ngày</div>}
        </td>
        <td className="px-4 py-3"><DebtStatusBadge status={debt.status} /></td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); onNavigate(); }} className="px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded">Xem</button>
            {canPay && <button onClick={(e) => { e.stopPropagation(); onPay(); }} className="px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 rounded">TT</button>}
            {(debt.status === 'UNPAID' || debt.status === 'CANCELLED') && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded">Xóa</button>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && history.length > 0 && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-4 py-0">
            <div className="py-3 pl-8 border-l-2 border-blue-300 ml-2 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Lịch sử thanh toán ({history.length} lần)
              </p>
              {history.map((entry, idx) => {
                const entryDate = entry.date ? (entry.date.includes('T') ? formatDate(entry.date) : entry.date) : '-';
                const entryPct = debtAmt > 0 ? (entry.runningTotal / debtAmt) * 100 : 0;
                const allImages = entry.images || [];
                return (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">+{formatCurrency(entry.amount)} VND</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{entryDate}</span>
                        <Tag variant={entryPct >= 100 ? 'success' : 'info'} size="sm">{entryPct.toFixed(0)}%</Tag>
                        {allImages.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewImages(allImages, `UNC - ${debt.customer.name} - ${entryDate}`); }}
                            className="inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 px-2 py-0.5 text-xs hover:bg-blue-200 transition-colors cursor-pointer"
                          >
                            Xem UNC
                          </button>
                        )}
                      </div>
                      {entry.note && <p className="text-gray-500 text-xs mt-0.5">{entry.note}</p>}
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500 tabular-nums">Tổng: {formatCurrency(entry.runningTotal)}</div>
                  </div>
                );
              })}
              {remainAmt > 0 && (
                <div className="pt-2 border-t border-gray-200 text-sm font-medium text-orange-600">
                  Còn lại: {formatCurrency(remainAmt)} VND
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
}
