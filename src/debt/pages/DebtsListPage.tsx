import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { Link } from 'react-router-dom';
import { getAllDebts, getAllCustomers, createDebt, updateDebt, markDebtAsPaid } from 'wasp/client/operations';
import { DebtTypeBadge } from '../components/DebtTypeBadge';
import { DebtStatusBadge } from '../components/DebtStatusBadge';
import { DebtFormModal, type DebtFormData } from '../components/DebtFormModal';
import { MarkAsPaidModal, type PaymentData } from '../components/MarkAsPaidModal';
import { Button } from '../../shared/components/Button';
import { getMonthOptions } from '../utils/debtCalculations';

type DebtStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';

export const DebtsListPage = () => {
  const [filters, setFilters] = useState<{
    customerId?: string;
    debtMonth?: string;
    status?: DebtStatus;
    isOverdue?: boolean;
  }>({});

  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Group debts by month
  const groupedDebts = debtsData?.debts.reduce((acc: any, debt: any) => {
    const month = debt.debtMonth;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(debt);
    return acc;
  }, {}) || {};

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Công nợ</h1>
              <p className="text-gray-600">Theo dõi công nợ khách hàng</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>+ Tạo công nợ mới</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <select
                value={filters.debtMonth || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, debtMonth: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khách hàng
              </label>
              <select
                value={filters.customerId || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, customerId: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: (e.target.value as DebtStatus) || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="OVERDUE">Quá hạn</option>
              </select>
            </div>
          </div>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="mr-2"
            />
            Chỉ hiển thị công nợ quá hạn
          </label>
        </div>

        {/* Summary Cards */}
        {debtsData?.summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Tổng công nợ</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(debtsData.summary.totalAmount)}
              </div>
              <div className="text-xs text-gray-500">VND</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Chưa thanh toán</div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(debtsData.summary.totalUnpaid)}
              </div>
              <div className="text-xs text-gray-500">
                {debtsData.summary.countUnpaid} công nợ
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Đã thanh toán</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(debtsData.summary.totalPaid)}
              </div>
              <div className="text-xs text-gray-500">
                {debtsData.summary.countPaid} công nợ
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Quá hạn</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(debtsData.summary.totalOverdue)}
              </div>
              <div className="text-xs text-gray-500">
                {debtsData.summary.countOverdue} công nợ
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Debts Table (Grouped by Month) */}
        {!isLoading && debtsData && (
          <div className="space-y-6">
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
                  <div key={month} className="bg-white rounded-lg shadow">
                    <div className="bg-gray-100 px-4 py-3 rounded-t-lg">
                      <h3 className="font-semibold text-gray-900">
                        Tháng {month.split('-')[1]}/{month.split('-')[0]}
                        <span className="text-gray-600 font-normal ml-2">
                          ({monthDebts.length} công nợ - {formatCurrency(monthTotal)} VND)
                        </span>
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Khách hàng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Loại
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Số tiền
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Ngày GN
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
                        <tbody className="divide-y divide-gray-200">
                          {monthDebts.map((debt: any) => (
                            <tr
                              key={debt.id}
                              className={debt.isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {debt.customer.name}
                                </div>
                                <div className="text-sm text-gray-500">{debt.customer.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <DebtTypeBadge type={debt.debtType} />
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {formatCurrency(Number(debt.amount))}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatDate(debt.recognitionDate)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">{formatDate(debt.dueDate)}</div>
                                {debt.isOverdue && (
                                  <div className="text-xs text-red-600">
                                    Quá hạn {debt.daysOverdue} ngày
                                  </div>
                                )}
                                {!debt.isOverdue && debt.daysUntilDue !== null && debt.daysUntilDue <= 7 && (
                                  <div className="text-xs text-yellow-600">
                                    Còn {debt.daysUntilDue} ngày
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <DebtStatusBadge status={debt.status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Link to={`/accounting/debts/${debt.id}`}>
                                    <Button size="sm" variant="ghost">
                                      Xem
                                    </Button>
                                  </Link>
                                  {debt.status === 'UNPAID' && (
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => {
                                        setSelectedDebt(debt);
                                        setIsPaymentModalOpen(true);
                                      }}
                                    >
                                      Thanh toán
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

            {Object.keys(groupedDebts).length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Không có công nợ nào</p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                  Tạo công nợ đầu tiên
                </Button>
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
    </div>
  );
};
