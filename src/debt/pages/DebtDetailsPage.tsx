import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getDebt, markDebtAsPaid, deleteDebt, updateDebt, getAllCustomers } from 'wasp/client/operations';
import { DebtTypeBadge } from '../components/DebtTypeBadge';
import { DebtStatusBadge } from '../components/DebtStatusBadge';
import { ImageGallery } from '../components/ImageGallery';
import { MarkAsPaidModal, type PaymentData } from '../components/MarkAsPaidModal';
import { DebtFormModal, type DebtFormData } from '../components/DebtFormModal';
import { Button } from '../../shared/components/Button';

export const DebtDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: debt, isLoading, error, refetch } = useQuery(getDebt, { id: id! });
  const { data: customers } = useQuery(getAllCustomers);

  const handleMarkAsPaid = async (data: PaymentData) => {
    if (!debt) return;

    try {
      await markDebtAsPaid({
        id: debt.id,
        ...data,
      });
      setIsPaymentModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = async (data: DebtFormData) => {
    if (!debt) return;

    try {
      await updateDebt({
        id: debt.id,
        ...data,
      });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!debt) return;

    if (!confirm('Bạn có chắc muốn xóa công nợ này?')) {
      return;
    }

    try {
      await deleteDebt({ id: debt.id });
      navigate('/accounting/debts');
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

  if (isLoading || !debt) {
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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/accounting/debts')}>
                ← Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Công nợ #{debt.id.slice(0, 8)}
                </h1>
                <p className="text-gray-600">{debt.customer.name}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setIsEditMode(true)}>
                Chỉnh sửa
              </Button>
              {debt.status === 'UNPAID' && (
                <Button variant="danger" onClick={handleDelete}>
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Debt Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin công nợ</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Loại công nợ:</span>
                <DebtTypeBadge type={debt.debtType} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tháng:</span>
                <span className="font-medium">
                  {debt.debtMonth.split('-')[1]}/{debt.debtMonth.split('-')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-bold text-lg text-blue-600">
                  {formatCurrency(Number(debt.amount))} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày ghi nhận:</span>
                <span className="font-medium">{formatDate(debt.recognitionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đến hạn:</span>
                <div className="text-right">
                  <div className="font-medium">{formatDate(debt.dueDate)}</div>
                  {debt.isOverdue && (
                    <div className="text-xs text-red-600">Quá hạn {debt.daysOverdue} ngày</div>
                  )}
                  {!debt.isOverdue && debt.daysUntilDue !== null && (
                    <div className="text-xs text-gray-600">Còn {debt.daysUntilDue} ngày</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin thanh toán</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <DebtStatusBadge status={debt.status} />
              </div>

              {debt.status === 'PAID' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền đã trả:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(Number(debt.paidAmount))} VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="font-medium">{formatDate(debt.paidDate!)}</span>
                  </div>
                  {debt.paymentNotes && (
                    <div>
                      <span className="text-gray-600 block mb-1">Ghi chú TT:</span>
                      <p className="text-sm">{debt.paymentNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền đã trả:</span>
                    <span className="text-gray-400">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="text-gray-400">-</span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-400 text-neutral-800 font-semibold rounded-md"
                    >
                      Cập nhật thanh toán
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Document Link */}
        {debt.documentLink && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Bảng kê / Chứng từ</h2>
            <a
              href={debt.documentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {debt.documentLink}
            </a>
          </div>
        )}

        {/* Invoice Images */}
        {debt.invoiceImages && debt.invoiceImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Hình ảnh Hóa đơn</h2>
            <ImageGallery images={debt.invoiceImages} />
          </div>
        )}

        {/* Payment Proof Images */}
        {debt.status === 'PAID' &&
          debt.paymentProofImages &&
          debt.paymentProofImages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">Hình ảnh UNC</h2>
              <ImageGallery images={debt.paymentProofImages} />
            </div>
          )}

        {/* Notes */}
        {debt.notes && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Ghi chú</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{debt.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Thông tin khác</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Người tạo:</span>
              <span>
                {debt.createdBy.fullName} ({debt.createdBy.email})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày tạo:</span>
              <span>{formatDate(debt.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cập nhật lần cuối:</span>
              <span>{formatDate(debt.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {debt && (
        <MarkAsPaidModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmit={handleMarkAsPaid}
          debt={debt}
        />
      )}

      {/* Edit Debt Modal */}
      {debt && customers && (
        <DebtFormModal
          isOpen={isEditMode}
          onClose={() => setIsEditMode(false)}
          onSubmit={handleEdit}
          customers={customers}
          isEdit={true}
          initialData={{
            customerId: debt.customerId,
            debtType: debt.debtType,
            debtMonth: debt.debtMonth,
            amount: Number(debt.amount),
            documentLink: debt.documentLink || '',
            invoiceImages: debt.invoiceImages,
            paymentProofImages: debt.paymentProofImages || [],
            notes: debt.notes || '',
            recognitionDate: new Date(debt.recognitionDate),
          }}
        />
      )}
    </div>
  );
};
