import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getCustomer, getDebtsSummaryByCustomer, updateCustomer, deleteCustomer } from 'wasp/client/operations';
import { Button } from '../../shared/components/Button';
import { CustomerFormModal, type CustomerFormData } from '../components/CustomerFormModal';

export const CustomerDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: customer, isLoading, error, refetch } = useQuery(getCustomer, { id: id! });
  const { data: debtsSummary } = useQuery(getDebtsSummaryByCustomer, { customerId: id! });

  const handleEdit = async (data: CustomerFormData) => {
    try {
      await updateCustomer({ id: id!, ...data });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    // Check if customer has debts
    if (debtsSummary && debtsSummary.countTotal > 0) {
      alert('Không thể xóa khách hàng đã có công nợ!');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${customer.name}"?`)) {
      return;
    }

    try {
      await deleteCustomer({ id: customer.id });
      navigate('/accounting/customers');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getStatementFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'Chưa thiết lập';
    const labels: Record<string, string> = {
      MONTHLY_25: '1 tháng 1 lần (ngày 25)',
      MONTHLY_30: '1 tháng 1 lần (ngày 30/31)',
      WEEKLY: '1 tuần 1 lần',
      BIMONTHLY: '1 tháng 2 lần (ngày 15 và 31)',
    };
    return labels[frequency] || frequency;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/accounting/customers')}>
                ← Quay lại
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{customer.name}</h1>
                  <span className={`inline-block w-3 h-3 rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
                {customer.hasVATInvoice && (
                  <div className="text-sm text-green-600 font-medium mt-1">#VAT</div>
                )}
                <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setIsEditMode(true)}>
                Chỉnh sửa
              </Button>
              {(!debtsSummary || debtsSummary.totalDebts === 0) && (
                <Button variant="danger" onClick={handleDelete}>
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Tên khách hàng</label>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <p className="font-medium">{customer.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Địa chỉ</label>
              <p className="font-medium">{customer.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Thời hạn công nợ</label>
              <p className="font-medium">
                {customer.paymentTermDays} {customer.paymentTermType === 'DAYS' ? 'ngày' : 'tháng'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quy định chốt bảng kê</label>
              <p className="font-medium">{getStatementFrequencyLabel(customer.statementFrequency)}</p>
            </div>
          </div>
        </div>

        {/* VAT Invoice Info */}
        {customer.hasVATInvoice && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin hóa đơn VAT</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Tên trên hóa đơn</label>
                <p className="font-medium">{customer.invoiceName || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Mã số thuế</label>
                <p className="font-medium">{customer.taxCode || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Địa chỉ thuế</label>
                <p className="font-medium">{customer.taxAddress || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debts Summary */}
        {debtsSummary && (
          <>
            {/* Section 1: Total Summary (All Time) */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Tổng quan công nợ (Toàn bộ thời gian)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Tổng công nợ</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(debtsSummary.totalAmount)} VND
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{debtsSummary.countTotal} công nợ</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(debtsSummary.totalPaid)} VND
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{debtsSummary.countPaid} công nợ</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Còn nợ</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(debtsSummary.totalUnpaid)} VND
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{debtsSummary.countUnpaid} công nợ</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Quá hạn</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(debtsSummary.totalOverdue)} VND
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{debtsSummary.countOverdue} công nợ</p>
                </div>
              </div>
            </div>

            {/* Section 2: Monthly Breakdown */}
            {debtsSummary.monthlyBreakdown && debtsSummary.monthlyBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Phân tích theo tháng</h2>
                <div className="space-y-3">
                  {debtsSummary.monthlyBreakdown.map((monthly: any) => (
                    <div
                      key={monthly.month}
                      className={`border rounded-lg p-4 ${
                        monthly.isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className={`font-semibold ${monthly.isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            Tháng {monthly.month}
                            {monthly.isOverdue && (
                              <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                Quá hạn
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {monthly.countTotal} công nợ
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Tổng công nợ</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(monthly.totalAmount)} VND
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Đã thanh toán</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(monthly.totalPaid)} VND
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Còn nợ</p>
                          <p className={`font-semibold ${monthly.isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                            {formatCurrency(monthly.totalUnpaid)} VND
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Debts List */}
        {debtsSummary && debtsSummary.debts && debtsSummary.debts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Danh sách công nợ</h2>
            <div className="space-y-3">
              {debtsSummary.debts.map((debt: any) => (
                <div
                  key={debt.id}
                  onClick={() => navigate(`/accounting/debts/${debt.id}`)}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        Tháng {debt.debtMonth} - {debt.debtType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(Number(debt.amount))} VND
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          debt.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : debt.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {debt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {customer && (
        <CustomerFormModal
          isOpen={isEditMode}
          onClose={() => setIsEditMode(false)}
          onSubmit={handleEdit}
          isEdit={true}
          initialData={{
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            address: customer.address || '',
            paymentTermDays: customer.paymentTermDays,
            paymentTermType: customer.paymentTermType,
            statementFrequency: customer.statementFrequency,
            hasVATInvoice: customer.hasVATInvoice,
            invoiceName: customer.invoiceName || '',
            taxCode: customer.taxCode || '',
            taxAddress: customer.taxAddress || '',
            status: customer.status,
          }}
        />
      )}
    </div>
  );
};
