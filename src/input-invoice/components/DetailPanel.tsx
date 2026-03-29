import { useState } from 'react';
import type { InputInvoiceRecord } from '../types';
import { updateInputInvoice, confirmInputInvoice, retryInputInvoiceOCR } from 'wasp/client/operations';

interface DetailPanelProps {
  invoice: InputInvoiceRecord | null;
  onClose: () => void;
  onUpdate: () => void;
}

const statusLabels: Record<string, string> = {
  PROCESSING: 'Đang xử lý OCR',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ERROR: 'Lỗi',
};

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  ERROR: 'bg-red-100 text-red-700',
};

export const DetailPanel = ({ invoice, onClose, onUpdate }: DetailPanelProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [imageView, setImageView] = useState<string | null>(null);

  if (!invoice) return null;

  const startEdit = () => {
    setForm({
      company: invoice.company,
      invoiceNumber: invoice.invoiceNumber || '',
      invoiceSymbol: invoice.invoiceSymbol || '',
      invoiceDate: invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toISOString().split('T')[0]
        : '',
      supplierName: invoice.supplierName || '',
      supplierTaxCode: invoice.supplierTaxCode || '',
      subtotal: invoice.subtotal ? String(invoice.subtotal) : '',
      taxRate: invoice.taxRate ? String(invoice.taxRate) : '',
      taxAmount: invoice.taxAmount ? String(invoice.taxAmount) : '',
      totalAmount: invoice.totalAmount ? String(invoice.totalAmount) : '',
      description: invoice.description || '',
      vehiclePlate: invoice.vehiclePlate || '',
      buyerName: invoice.buyerName || '',
      notes: invoice.notes || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(null);
    setEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateInputInvoice({
        id: invoice.id,
        company: form.company,
        invoiceNumber: form.invoiceNumber || null,
        invoiceSymbol: form.invoiceSymbol || null,
        invoiceDate: form.invoiceDate || null,
        supplierName: form.supplierName || null,
        supplierTaxCode: form.supplierTaxCode || null,
        subtotal: parseFloat(form.subtotal) || null,
        taxRate: parseFloat(form.taxRate) || null,
        taxAmount: parseFloat(form.taxAmount) || null,
        totalAmount: parseFloat(form.totalAmount) || null,
        description: form.description || null,
        vehiclePlate: form.vehiclePlate || null,
        buyerName: form.buyerName || null,
        notes: form.notes || null,
      });
      setEditing(false);
      setForm(null);
      onUpdate();
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm('Xác nhận chứng từ này?')) return;
    setSaving(true);
    try {
      await confirmInputInvoice({ id: invoice.id });
      onUpdate();
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRetryOCR = async () => {
    if (!confirm('Retry OCR cho chứng từ này?')) return;
    setSaving(true);
    try {
      await retryInputInvoiceOCR({ id: invoice.id });
      onUpdate();
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const canConfirm = invoice.status === 'PENDING';

  return (
    <>
      {/* Image Lightbox */}
      {imageView && (
        <div
          className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4"
          onClick={() => setImageView(null)}
        >
          <img src={imageView} alt="" className="max-w-full max-h-[90vh] rounded" />
        </div>
      )}

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full lg:w-3/4 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Chi tiết chứng từ</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${statusColors[invoice.status]}`}>
                {statusLabels[invoice.status]}
              </span>
              <span className="text-xs text-gray-500">{invoice.company}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Content - 2-column layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {/* LEFT: Image/File Preview */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Files ({invoice.fileUrls.length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {invoice.fileUrls.map((url, idx) => {
                  const isPDF = invoice.mimeTypes[idx]?.includes('pdf');
                  return (
                    <div
                      key={idx}
                      onClick={() => !isPDF && setImageView(url)}
                      className={`border rounded-lg overflow-hidden ${!isPDF ? 'cursor-pointer hover:border-primary-400' : ''}`}
                    >
                      {isPDF ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 text-center bg-gray-50">
                          <div className="text-3xl">📄</div>
                          <div className="text-xs text-gray-600 mt-1 truncate">{invoice.fileNames[idx]}</div>
                        </a>
                      ) : (
                        <img src={url} alt="" className="w-full h-40 object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Form Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Thông tin chứng từ</h4>
                {!editing && invoice.status !== 'CONFIRMED' && (
                  <button onClick={startEdit} className="text-sm text-blue-600 hover:underline">✏️ Sửa</button>
                )}
              </div>

              {editing && form ? (
                <form className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Số HĐ</label>
                      <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ký hiệu</label>
                      <input value={form.invoiceSymbol} onChange={e => setForm({ ...form, invoiceSymbol: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ngày HĐ</label>
                    <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nhà cung cấp</label>
                    <input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">MST NCC</label>
                    <input value={form.supplierTaxCode} onChange={e => setForm({ ...form, supplierTaxCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Trước VAT</label>
                      <input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">VAT %</label>
                      <input type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tổng TT</label>
                      <input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nội dung</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Biển số xe</label>
                      <input value={form.vehiclePlate} onChange={e => setForm({ ...form, vehiclePlate: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Người mua</label>
                      <input value={form.buyerName} onChange={e => setForm({ ...form, buyerName: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                    <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={cancelEdit} className="flex-1 py-2 bg-gray-100 rounded text-sm">Huỷ</button>
                    <button type="button" onClick={saveEdit} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-2 text-sm">
                  {[
                    { label: 'Số HĐ', value: invoice.invoiceNumber },
                    { label: 'Ký hiệu', value: invoice.invoiceSymbol },
                    { label: 'Ngày HĐ', value: invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('vi-VN') : null },
                    { label: 'Nhà cung cấp', value: invoice.supplierName },
                    { label: 'MST NCC', value: invoice.supplierTaxCode },
                    { label: 'Trước VAT', value: invoice.subtotal ? Number(invoice.subtotal).toLocaleString('vi-VN') : null },
                    { label: 'VAT %', value: invoice.taxRate },
                    { label: 'Tổng thanh toán', value: invoice.totalAmount ? Number(invoice.totalAmount).toLocaleString('vi-VN') + ' VND' : null },
                    { label: 'Nội dung', value: invoice.description },
                    { label: 'Biển số xe', value: invoice.vehiclePlate },
                    { label: 'Người mua', value: invoice.buyerName },
                    { label: 'Ghi chú', value: invoice.notes },
                  ].map((row, idx) => (
                    <div key={idx} className="flex">
                      <dt className="w-1/3 text-gray-600">{row.label}:</dt>
                      <dd className="w-2/3 font-medium text-gray-900">{row.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            {invoice.ocrTask && `OCR: ${invoice.ocrTask.provider} • ${invoice.ocrTask.retryCount} retries`}
          </div>
          <div className="flex gap-2">
            {invoice.status === 'ERROR' && (
              <button onClick={handleRetryOCR} disabled={saving} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
                Retry OCR
              </button>
            )}
            {canConfirm && (
              <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                ✓ Xác nhận
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
