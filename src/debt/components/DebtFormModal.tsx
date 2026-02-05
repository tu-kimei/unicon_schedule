import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import type { Customer } from 'wasp/entities';
import { Modal } from './Modal';
import { Button } from '../../shared/components/Button';
import { SimpleInput } from './SimpleInput';
import { MonthPicker } from './MonthPicker';
import { CurrencyInput } from './CurrencyInput';
import { FileUpload } from './FileUpload';
import { calculateDueDate, getCurrentMonth } from '../utils/debtCalculations';
import { getSessionId } from 'wasp/client/api';

type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';
type PaymentTermType = 'DAYS' | 'MONTHS';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DebtFormData) => void;
  initialData?: DebtFormData;
  customers: Customer[];
  isEdit?: boolean;
}

export interface DebtFormData {
  customerId: string;
  debtType: DebtType;
  debtMonth: string;
  amount: number;
  documentLink?: string;
  invoiceImages?: string[];
  paymentProofImages?: string[];
  notes?: string;
  recognitionDate?: Date;
}

export const DebtFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customers,
  isEdit = false,
}: DebtFormModalProps) => {
  const [formData, setFormData] = useState<DebtFormData>({
    customerId: initialData?.customerId || '',
    debtType: initialData?.debtType || 'FREIGHT',
    debtMonth: initialData?.debtMonth || getCurrentMonth(),
    amount: initialData?.amount || 0,
    documentLink: initialData?.documentLink || '',
    invoiceImages: initialData?.invoiceImages || [],
    notes: initialData?.notes || '',
    recognitionDate: initialData?.recognitionDate || new Date(),
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Update formData when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerId: initialData.customerId || '',
        debtType: initialData.debtType || 'FREIGHT',
        debtMonth: initialData.debtMonth || getCurrentMonth(),
        amount: initialData.amount || 0,
        documentLink: initialData.documentLink || '',
        invoiceImages: initialData.invoiceImages || [],
        paymentProofImages: initialData.paymentProofImages || [],
        notes: initialData.notes || '',
        recognitionDate: initialData.recognitionDate || new Date(),
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find((c) => c.id === formData.customerId);
      setSelectedCustomer(customer || null);
    }
  }, [formData.customerId, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUploading(true);
    
    try {
      let finalInvoiceUrls = formData.invoiceImages || [];
      let finalPaymentUrls = formData.paymentProofImages || [];
      
      // Upload invoice files if any
      if (invoiceFiles.length > 0) {
        const uploadedUrls = await uploadFiles(invoiceFiles, 'invoices', formData.debtMonth);
        finalInvoiceUrls = [...finalInvoiceUrls, ...uploadedUrls];
      }
      
      // Upload payment files if any
      if (paymentFiles.length > 0) {
        const uploadedUrls = await uploadFiles(paymentFiles, 'payments', formData.debtMonth);
        finalPaymentUrls = [...finalPaymentUrls, ...uploadedUrls];
      }
      
      // Submit form with all URLs
      onSubmit({
        ...formData,
        invoiceImages: finalInvoiceUrls,
        paymentProofImages: finalPaymentUrls,
      });
    } catch (err: any) {
      alert('Lỗi upload file: ' + err.message);
    } finally {
      setIsUploading(false);
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

  const handleChange = (field: keyof DebtFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculatedDueDate = selectedCustomer
    ? calculateDueDate(
        formData.recognitionDate || new Date(),
        selectedCustomer.paymentTermDays,
        selectedCustomer.paymentTermType
      )
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Sửa công nợ' : 'Tạo công nợ mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Khách hàng <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => handleChange('customerId', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn khách hàng</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>

        {/* Debt Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại công nợ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="debtType"
                value="FREIGHT"
                checked={formData.debtType === 'FREIGHT'}
                onChange={(e) => handleChange('debtType', e.target.value as DebtType)}
                className="mr-2"
              />
              Cước vận chuyển
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="debtType"
                value="ADVANCE"
                checked={formData.debtType === 'ADVANCE'}
                onChange={(e) => handleChange('debtType', e.target.value as DebtType)}
                className="mr-2"
              />
              Chi hộ
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="debtType"
                value="OTHER"
                checked={formData.debtType === 'OTHER'}
                onChange={(e) => handleChange('debtType', e.target.value as DebtType)}
                className="mr-2"
              />
              Khác
            </label>
          </div>
        </div>

        {/* Debt Month */}
        <MonthPicker
          label="Tháng"
          value={formData.debtMonth}
          onChange={(value) => handleChange('debtMonth', value)}
          required
        />

        {/* Amount */}
        <CurrencyInput
          label="Số tiền"
          value={formData.amount}
          onChange={(value) => handleChange('amount', value)}
          required
        />

        {/* Recognition Date */}
        <SimpleInput
          label="Ngày ghi nhận"
          type="date"
          value={
            formData.recognitionDate
              ? formData.recognitionDate.toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => handleChange('recognitionDate', new Date(e.target.value))}
          required
        />

        {/* Due Date (Display only) */}
        {selectedCustomer && calculatedDueDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-gray-700">
              <strong>Ngày đến hạn (Tự động tính):</strong>{' '}
              {calculatedDueDate.toLocaleDateString('vi-VN')}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Dựa vào thời hạn: {selectedCustomer.paymentTermDays}{' '}
              {selectedCustomer.paymentTermType === 'DAYS' ? 'ngày' : 'tháng'}
            </div>
          </div>
        )}

        {/* Document Link */}
        <SimpleInput
          label="Link bảng kê / Chứng từ"
          type="url"
          value={formData.documentLink}
          onChange={(e) => handleChange('documentLink', e.target.value)}
          placeholder="https://docs.google.com/..."
        />

        {/* Invoice Images Upload */}
        <FileUpload
          label="Hình ảnh Hóa đơn"
          type="invoice"
          debtMonth={formData.debtMonth}
          onFilesChange={setInvoiceFiles}
          onExistingFilesChange={(urls) => handleChange('invoiceImages', urls)}
          existingFiles={formData.invoiceImages || []}
        />

        {/* Payment Proof Images Upload (for edit mode) */}
        {isEdit && (
          <FileUpload
            label="Hình ảnh UNC (Ủy nhiệm chi)"
            type="payment"
            debtMonth={formData.debtMonth}
            onFilesChange={setPaymentFiles}
            onExistingFilesChange={(urls) => handleChange('paymentProofImages', urls)}
            existingFiles={formData.paymentProofImages || []}
          />
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập ghi chú..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isUploading}>
            {isUploading ? 'Đang upload files...' : (isEdit ? 'Cập nhật' : 'Tạo công nợ')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
