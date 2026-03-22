import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getDebt, markDebtAsPaid, deleteDebt, updateDebt, getAllCustomers } from 'wasp/client/operations';
import { DebtTypeBadge } from '../components/DebtTypeBadge';
import { DebtStatusBadge } from '../components/DebtStatusBadge';
import { ImageGallery } from '../components/ImageGallery';
import { MarkAsPaidModal, type PaymentData } from '../components/MarkAsPaidModal';
import { DebtFormModal, type DebtFormData } from '../components/DebtFormModal';
import { Button } from '../../shared/components/Button';
import { Tag } from '../../shared/components/Tag';

// ============================================================================
// Types
// ============================================================================

interface PaymentEntry {
  date: string;
  amount: number;
  note: string;
  images: string[];
  runningTotal: number;
}

// ============================================================================
// Main Component
// ============================================================================

export const DebtDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingImages, setViewingImages] = useState<{ images: string[]; label: string } | null>(null);

  const { data: debt, isLoading, error, refetch } = useQuery(getDebt, { id: id! });
  const { data: customers } = useQuery(getAllCustomers);

  const handleMarkAsPaid = async (data: PaymentData) => {
    if (!debt) return;
    try {
      await markDebtAsPaid({ id: debt.id, ...data });
      setIsPaymentModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = async (data: DebtFormData) => {
    if (!debt) return;
    try {
      await updateDebt({ id: debt.id, ...data });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!debt) return;
    if (!confirm('Bạn có chắc muốn xóa công nợ này?')) return;
    try {
      await deleteDebt({ id: debt.id });
      navigate('/accounting/debts');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Use payments relation directly from DB
  const paymentHistory = useMemo(() => {
    if (!debt?.payments || debt.payments.length === 0) return [];
    let running = 0;
    return debt.payments.map((p: any) => {
      running += Number(p.amount);
      return {
        id: p.id,
        date: p.paidDate,
        amount: Number(p.amount),
        note: p.notes || '',
        images: p.proofImages || [],
        runningTotal: running,
        createdBy: p.createdBy,
      };
    });
  }, [debt?.payments]);

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

  const debtAmt = Number(debt.amount);
  const paidAmt = Number(debt.paidAmount || 0);
  const remainingAmt = debtAmt - paidAmt;
  const paidPercent = debtAmt > 0 ? Math.min((paidAmt / debtAmt) * 100, 100) : 0;
  const isFullyPaid = debt.status === 'PAID';
  const canPay = !isFullyPaid && debt.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/accounting/debts')}>
                ← Quay lại
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Công nợ #{debt.id.slice(0, 8)}
                  </h1>
                  <DebtStatusBadge status={debt.status} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{debt.customer.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setIsEditMode(true)}>
                Chỉnh sửa
              </Button>
              {(debt.status === 'UNPAID' || debt.status === 'OVERDUE') && (
                <Button variant="danger" onClick={handleDelete}>
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Payment Progress Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Tổng công nợ</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(debtAmt)} VND</p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-sm text-gray-500">Đã thanh toán</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(paidAmt)} VND</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Còn lại</p>
                <p className={`text-lg font-bold ${remainingAmt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingAmt)} VND
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isFullyPaid ? 'bg-green-500' : paidPercent > 0 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className={`text-xs font-medium ${isFullyPaid ? 'text-green-600' : 'text-primary-600'}`}>
                {paidPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>

          {/* Pay Button */}
          {canPay && (
            <div className="mt-4">
              <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)} className="w-full sm:w-auto">
                {paidAmt > 0 ? 'Ghi nhận thanh toán tiếp' : 'Ghi nhận thanh toán'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debt Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin công nợ</h2>
            </div>
            <div className="p-6 space-y-3">
              <InfoRow label="Loại công nợ" value={<DebtTypeBadge type={debt.debtType} />} required />
              <InfoRow
                label="Tháng"
                value={`${debt.debtMonth.split('-')[1]}/${debt.debtMonth.split('-')[0]}`}
                required
              />
              <InfoRow
                label="Số tiền"
                required
                value={
                  <span className="font-bold text-primary-600">
                    {formatCurrency(debtAmt)} VND
                  </span>
                }
              />
              <InfoRow label="Ngày ghi nhận" value={formatDate(debt.recognitionDate)} />
              <InfoRow
                label="Đến hạn"
                required
                value={
                  <div className="text-right">
                    <span className="font-medium">{formatDate(debt.dueDate)}</span>
                    {debt.isOverdue && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Quá hạn {debt.daysOverdue} ngày
                      </span>
                    )}
                  </div>
                }
              />
              <InfoRow label="Khách hàng" value={debt.customer.name} required />
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin khác</h2>
            </div>
            <div className="p-6 space-y-3">
              <InfoRow label="Trạng thái" value={<DebtStatusBadge status={debt.status} />} />
              <InfoRow label="Người tạo" value={`${debt.createdBy.fullName}`} />
              <InfoRow label="Ngày tạo" value={formatDate(debt.createdAt)} />
              <InfoRow label="Cập nhật" value={formatDate(debt.updatedAt)} />
              {debt.documentLink && (
                <InfoRow
                  label="Bảng kê"
                  value={
                    <a
                      href={debt.documentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm truncate max-w-[200px] inline-block"
                    >
                      Xem bảng kê
                    </a>
                  }
                />
              )}
              {debt.notes && <InfoRow label="Ghi chú" value={debt.notes} />}
            </div>
          </div>
        </div>

        {/* Payment History Timeline */}
        {paymentHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Lịch sử thanh toán ({paymentHistory.length} lần)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-0">
                {paymentHistory.map((entry: any, idx: number) => {
                  const entryDate = entry.date
                    ? formatDate(entry.date)
                    : '-';
                  const isLast = idx === paymentHistory.length - 1;
                  const entryPercent = debtAmt > 0 ? (entry.runningTotal / debtAmt) * 100 : 0;

                  return (
                    <div key={idx} className="relative flex gap-4">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 mt-1.5 flex-shrink-0 ${
                          isLast && isFullyPaid
                            ? 'bg-green-500 border-green-500'
                            : 'bg-blue-500 border-blue-500'
                        }`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-0'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                +{formatCurrency(entry.amount)} VND
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="text-sm text-gray-500">{entryDate}</span>
                              <Tag variant={entryPercent >= 100 ? 'success' : 'info'} size="sm">
                                {entryPercent.toFixed(0)}%
                              </Tag>
                              {entry.images && entry.images.length > 0 && (
                                <button
                                  onClick={() =>
                                    setViewingImages({
                                      images: entry.images,
                                      label: `UNC lần ${idx + 1} - ${entryDate} - ${formatCurrency(entry.amount)} VND`,
                                    })
                                  }
                                  className="inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 px-2 py-0.5 text-xs hover:bg-blue-200 transition-colors cursor-pointer"
                                >
                                  Xem UNC
                                </button>
                              )}
                            </div>
                            {entry.note && (
                              <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-gray-500">Tổng: {formatCurrency(entry.runningTotal)} VND</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Documents Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Images */}
          {debt.invoiceImages && debt.invoiceImages.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Hình ảnh Hóa đơn</h2>
              </div>
              <div className="p-4">
                <ImageGallery images={debt.invoiceImages} />
              </div>
            </div>
          )}

          {/* Note: UNC images are now shown per-payment in the timeline above */}
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

      {/* UNC Image Viewer Dialog */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewingImages(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">{viewingImages.label}</h3>
              <button onClick={() => setViewingImages(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewingImages.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-gray-200 overflow-hidden hover:border-primary-400 transition-colors">
                    <img src={img} alt={`UNC ${i + 1}`} className="w-full h-auto object-contain max-h-80" />
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
// Helper Components & Functions
// ============================================================================

function InfoRow({
  label,
  value,
  required,
}: {
  label: string;
  value: any;
  required?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 whitespace-nowrap">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {value || <span className="text-gray-300">-</span>}
      </span>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('vi-VN');
}
