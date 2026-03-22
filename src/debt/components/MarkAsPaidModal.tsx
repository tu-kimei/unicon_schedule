import { useState } from 'react';
import { Dialog } from '../../shared/components/Dialog';
import { Button } from '../../shared/components/Button';
import { CurrencyInput } from './CurrencyInput';
import { FileUpload } from './FileUpload';
import { getSessionId } from 'wasp/client/api';

interface MarkAsPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentData) => void;
  debt: {
    id: string;
    customer: { name: string };
    amount: number;
    paidAmount?: number;
    dueDate: Date;
    debtMonth: string;
  };
}

export interface PaymentData {
  paidAmount: number;
  paidDate: Date;
  paymentProofImages?: string[];
  paymentNotes?: string;
}

export const MarkAsPaidModal = ({ isOpen, onClose, onSubmit, debt }: MarkAsPaidModalProps) => {
  const previouslyPaid = Number(debt.paidAmount || 0);
  const remaining = Number(debt.amount) - previouslyPaid;

  const [formData, setFormData] = useState<PaymentData>({
    paidAmount: remaining,
    paidDate: new Date(),
    paymentNotes: '',
    paymentProofImages: [],
  });
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls = await uploadFiles(paymentFiles, 'payments', debt.debtMonth);
        const allPaymentUrls = [...(formData.paymentProofImages || []), ...uploadedUrls];
        onSubmit({ ...formData, paymentProofImages: allPaymentUrls });
      } catch (err: any) {
        alert('Lỗi upload file: ' + err.message);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      onSubmit(formData);
    }
  };

  const uploadFiles = async (files: File[], type: string, debtMonth: string): Promise<string[]> => {
    const fd = new FormData();
    files.forEach((file) => fd.append('files', file));
    fd.append('category', 'debts');
    fd.append('type', type);
    fd.append('debtMonth', debtMonth);

    const sessionId = getSessionId();
    const headers: HeadersInit = {};
    if (sessionId) headers['Authorization'] = `Bearer ${sessionId}`;

    const apiUrl = import.meta.env.REACT_APP_API_URL || '';
    const response = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      body: fd,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.urls;
  };

  const handleChange = (field: keyof PaymentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Cập nhật thanh toán</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="payment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Debt Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Khách hàng:</span>{' '}
              <span className="font-medium">{debt.customer.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Số tiền công nợ:</span>{' '}
              <span className="text-lg font-semibold text-blue-700">
                {formatCurrency(Number(debt.amount))} VND
              </span>
            </div>
            {previouslyPaid > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Đã thanh toán:</span>{' '}
                <span className="text-green-600 font-medium">
                  {formatCurrency(previouslyPaid)} VND
                </span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-600">Còn lại:</span>{' '}
              <span className={`font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(remaining)} VND
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Đến hạn:</span>{' '}
              <span className="font-medium">{new Date(debt.dueDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Paid Amount */}
          <CurrencyInput
            label="Số tiền thanh toán lần này"
            value={formData.paidAmount}
            onChange={(value) => handleChange('paidAmount', value)}
            required
            helperText={`Tối đa: ${formatCurrency(remaining)} VND`}
          />

          {/* Paid Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thanh toán <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.paidDate.toISOString().split('T')[0]}
              onChange={(e) => handleChange('paidDate', new Date(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Payment Proof Images */}
          <FileUpload
            label="Hình ảnh UNC (Ủy nhiệm chi)"
            type="payment"
            debtMonth={debt.debtMonth}
            onFilesChange={setPaymentFiles}
            existingFiles={formData.paymentProofImages || []}
          />

          {/* Payment Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú thanh toán
            </label>
            <textarea
              value={formData.paymentNotes}
              onChange={(e) => handleChange('paymentNotes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ví dụ: Đã nhận chuyển khoản ngày 25/3..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="submit" form="payment-form" variant="primary" disabled={isUploading}>
            {isUploading ? 'Đang upload...' : 'Xác nhận thanh toán'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
