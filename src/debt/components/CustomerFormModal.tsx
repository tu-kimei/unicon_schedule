import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../../shared/components/Button';
import { SimpleInput } from './SimpleInput';
import { Select } from '../../shared/components/Select';

type PaymentTermType = 'DAYS' | 'MONTHS';
type StatementFrequency = 'MONTHLY_25' | 'MONTHLY_30' | 'WEEKLY' | 'BIMONTHLY';
type CustomerStatus = 'ACTIVE' | 'INACTIVE';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  initialData?: CustomerFormData;
  isEdit?: boolean;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentTermDays: number;
  paymentTermType: PaymentTermType;
  statementFrequency?: StatementFrequency;
  hasVATInvoice: boolean;
  invoiceName?: string;
  taxCode?: string;
  taxAddress?: string;
  status: CustomerStatus;
}

export const CustomerFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: CustomerFormModalProps) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    paymentTermDays: initialData?.paymentTermDays || 30,
    paymentTermType: initialData?.paymentTermType || 'DAYS',
    statementFrequency: initialData?.statementFrequency,
    hasVATInvoice: initialData?.hasVATInvoice || false,
    invoiceName: initialData?.invoiceName || '',
    taxCode: initialData?.taxCode || '',
    taxAddress: initialData?.taxAddress || '',
    status: initialData?.status || 'ACTIVE',
  });

  // Update formData when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        paymentTermDays: initialData.paymentTermDays || 30,
        paymentTermType: initialData.paymentTermType || 'DAYS',
        statementFrequency: initialData.statementFrequency,
        hasVATInvoice: initialData.hasVATInvoice || false,
        invoiceName: initialData.invoiceName || '',
        taxCode: initialData.taxCode || '',
        taxAddress: initialData.taxAddress || '',
        status: initialData.status || 'ACTIVE',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const statementFrequencyOptions = [
    { value: 'MONTHLY_25', label: '1 tháng 1 lần (ngày 25)' },
    { value: 'MONTHLY_30', label: '1 tháng 1 lần (ngày 30/31)' },
    { value: 'WEEKLY', label: '1 tuần 1 lần' },
    { value: 'BIMONTHLY', label: '1 tháng 2 lần (ngày 15 và 31)' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang hợp tác' },
    { value: 'INACTIVE', label: 'Ngưng hợp tác' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Sửa khách hàng' : 'Tạo khách hàng mới'}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {/* Name */}
        <SimpleInput
          label="Tên khách hàng"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          placeholder="VD: Công ty TNHH ABC"
        />

        {/* Email */}
        <SimpleInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          placeholder="contact@company.com"
        />

        {/* Phone */}
        <SimpleInput
          label="Số điện thoại"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="0901234567"
        />

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Địa chỉ công ty..."
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời hạn công nợ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={formData.paymentTermDays}
              onChange={(e) => handleChange('paymentTermDays', parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.paymentTermType}
              onChange={(e) => handleChange('paymentTermType', e.target.value as PaymentTermType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DAYS">Ngày</option>
              <option value="MONTHS">Tháng</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            VD: 30 ngày, 1 tháng, 3 tháng
          </p>
        </div>

        {/* Statement Frequency */}
        <Select
          label="Quy định chốt bảng kê"
          options={statementFrequencyOptions}
          value={formData.statementFrequency || ''}
          onChange={(e) => handleChange('statementFrequency', e.target.value || undefined)}
          placeholder="Chọn quy định chốt bảng kê"
        />

        {/* Status */}
        <Select
          label="Trạng thái"
          options={statusOptions}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as CustomerStatus)}
          required
        />

        {/* VAT Invoice */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasVATInvoice}
              onChange={(e) => handleChange('hasVATInvoice', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Có xuất HĐ VAT</span>
          </label>
        </div>

        {/* VAT Invoice Details - Only show if hasVATInvoice is true */}
        {formData.hasVATInvoice && (
          <div className="space-y-4 pl-6 border-l-2 border-blue-200">
            <SimpleInput
              label="Tên trên hóa đơn"
              type="text"
              value={formData.invoiceName}
              onChange={(e) => handleChange('invoiceName', e.target.value)}
              placeholder="Tên công ty trên hóa đơn"
            />

            <SimpleInput
              label="Mã số thuế (MST)"
              type="text"
              value={formData.taxCode}
              onChange={(e) => handleChange('taxCode', e.target.value)}
              placeholder="0123456789"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ thuế
              </label>
              <textarea
                value={formData.taxAddress}
                onChange={(e) => handleChange('taxAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Địa chỉ trên hóa đơn..."
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Cập nhật' : 'Tạo khách hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
