import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../../shared/components/Button';
import { SimpleInput } from './SimpleInput';
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
  const [formData, setFormData] = useState<PaymentData>({
    paidAmount: Number(debt.amount),
    paidDate: new Date(),
    paymentNotes: '',
    paymentProofImages: [],
  });
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload files first if there are new files
    if (paymentFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls = await uploadFiles(paymentFiles, 'payments', debt.debtMonth);
        
        // Merge with existing files
        const allPaymentUrls = [...(formData.paymentProofImages || []), ...uploadedUrls];
        
        // Submit form with uploaded URLs
        onSubmit({
          ...formData,
          paymentProofImages: allPaymentUrls,
        });
      } catch (err: any) {
        alert('Lỗi upload file: ' + err.message);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      // No new files, submit directly
      onSubmit(formData);
    }
  };

  // Helper function to upload files
  const uploadFiles = async (files: File[], type: string, debtMonth: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', 'debts'); // Specify category for proper folder organization
    formData.append('type', type);
    formData.append('debtMonth', debtMonth);

    const sessionId = getSessionId();
    const headers: HeadersInit = {};
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật thanh toán">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Debt Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
          <div className="text-sm">
            <strong>Khách hàng:</strong> {debt.customer.name}
          </div>
          <div className="text-sm">
            <strong>Số tiền công nợ:</strong>{' '}
            <span className="text-lg font-semibold text-blue-700">
              {formatCurrency(Number(debt.amount))} VND
            </span>
          </div>
          <div className="text-sm">
            <strong>Đến hạn:</strong> {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Paid Amount */}
        <CurrencyInput
          label="Số tiền thanh toán"
          value={formData.paidAmount}
          onChange={(value) => handleChange('paidAmount', value)}
          required
          readOnly
          helperText="MVP chỉ hỗ trợ thanh toán full"
        />

        {/* Paid Date */}
        <SimpleInput
          label="Ngày thanh toán"
          type="date"
          value={formData.paidDate.toISOString().split('T')[0]}
          onChange={(e) => handleChange('paidDate', new Date(e.target.value))}
          required
        />

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ví dụ: Đã nhận chuyển khoản ngày 25/3..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isUploading}>
            {isUploading ? 'Đang upload files...' : 'Xác nhận thanh toán'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
