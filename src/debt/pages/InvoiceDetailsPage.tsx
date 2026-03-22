import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getInvoice, updateInvoiceStatus, deleteInvoice } from 'wasp/client/operations';
import { Button } from '../../shared/components/Button';

// ============================================================================
// Types & Constants
// ============================================================================

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Nhap',
  SENT: 'Da gui',
  PAID: 'Da thanh toan',
  PARTIAL: 'Thanh toan mot phan',
  OVERDUE: 'Qua han',
  CANCELLED: 'Da huy',
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const CHARGE_TYPE_LABELS: Record<string, string> = {
  FREIGHT: 'C\u01B0\u1EDBc v\u1EADn chuy\u1EC3n',
  FUEL_SURCHARGE: 'Ph\u1EE5 ph\u00ED nhi\u00EAn li\u1EC7u',
  DETENTION: 'Ph\u00ED l\u01B0u container',
  DEMURRAGE: 'Ph\u00ED l\u01B0u b\u00E3i',
  LOADING: 'Ph\u00ED b\u1ED1c x\u1EBFp',
  UNLOADING: 'Ph\u00ED d\u1EE1 h\u00E0ng',
  CUSTOMS: 'Ph\u00ED h\u1EA3i quan',
  TOLL_FEE: 'Ph\u00ED c\u1EA7u \u0111\u01B0\u1EDDng',
  PARKING: 'Ph\u00ED \u0111\u1ED7 xe',
  INSURANCE: 'Ph\u00ED b\u1EA3o hi\u1EC3m',
  OTHER: 'Chi ph\u00ED kh\u00E1c',
};

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('vi-VN');
};

// ============================================================================
// InvoiceDetailsPage
// ============================================================================

export const InvoiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const { data: invoice, isLoading, error, refetch } = useQuery(getInvoice, { id: id! });

  const handleStatusUpdate = async (status: InvoiceStatus) => {
    if (status === 'PAID') {
      setShowPaymentForm(true);
      return;
    }

    const confirmMsg =
      status === 'SENT'
        ? 'Xac nhan gui hoa don cho khach hang?'
        : status === 'CANCELLED'
          ? 'Ban co chac chan muon huy hoa don nay?'
          : `Cap nhat trang thai thanh ${STATUS_LABELS[status]}?`;

    if (!confirm(confirmMsg)) return;

    setIsUpdating(true);
    try {
      await updateInvoiceStatus({ invoiceId: invoice.id, status });
      refetch();
    } catch (err: any) {
      alert('Loi: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsUpdating(true);
    try {
      await updateInvoiceStatus({
        invoiceId: invoice.id,
        status: 'PAID',
        paymentMethod: paymentMethod || undefined,
        paymentRef: paymentRef || undefined,
      });
      setShowPaymentForm(false);
      refetch();
    } catch (err: any) {
      alert('Loi: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Ban co chac chan muon xoa hoa don ${invoice.invoiceNumber}?`)) return;
    try {
      await deleteInvoice({ invoiceId: invoice.id });
      navigate('/accounting/invoices');
    } catch (err: any) {
      alert('Loi: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error ? `Loi: ${error.message}` : 'Khong tim thay hoa don'}
            </p>
          </div>
          <button
            onClick={() => navigate('/accounting/invoices')}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm"
          >
            Quay lai danh sach
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate('/accounting/invoices')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lai danh sach hoa don
        </button>

        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Tao boi {invoice.createdBy?.fullName} &middot; {formatDateTime(invoice.createdAt)}
                </p>
              </div>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[invoice.status as InvoiceStatus] || 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Thong tin khach hang
                </h3>
                <p className="font-semibold text-gray-900">{invoice.customer?.name}</p>
                {invoice.customer?.email && (
                  <p className="text-sm text-gray-600">{invoice.customer.email}</p>
                )}
                {invoice.customer?.phone && (
                  <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
                )}
                {invoice.customer?.taxCode && (
                  <p className="text-sm text-gray-600">MST: {invoice.customer.taxCode}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Thong tin hoa don
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Ngay hoa don:</span>{' '}
                    <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Han thanh toan:</span>{' '}
                    <span className={invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </p>
                  {invoice.sentAt && (
                    <p>
                      <span className="text-gray-500">Ngay gui:</span>{' '}
                      <span className="text-gray-900">{formatDateTime(invoice.sentAt)}</span>
                    </p>
                  )}
                  {invoice.paidAt && (
                    <p>
                      <span className="text-gray-500">Ngay thanh toan:</span>{' '}
                      <span className="text-green-700 font-medium">{formatDateTime(invoice.paidAt)}</span>
                    </p>
                  )}
                  {invoice.shipment && (
                    <p>
                      <span className="text-gray-500">Shipment:</span>{' '}
                      <Link
                        to={`/ops/shipments/${invoice.shipment.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {invoice.shipment.shipmentNumber}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Ghi chu</h3>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {invoice.paymentMethod && (
              <div className="mt-3">
                <p className="text-sm">
                  <span className="text-gray-500">Phuong thuc TT:</span>{' '}
                  <span className="text-gray-900">{invoice.paymentMethod}</span>
                </p>
                {invoice.paymentRef && (
                  <p className="text-sm">
                    <span className="text-gray-500">Ma tham chieu:</span>{' '}
                    <span className="text-gray-900">{invoice.paymentRef}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chi tiet hoa don</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mo ta
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    SL
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Don gia
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thanh tien
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {item.description}
                      </div>
                      {item.charge && (
                        <div className="text-xs text-gray-500">
                          {CHARGE_TYPE_LABELS[item.charge.chargeType] || item.charge.chargeType}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold tabular-nums">
                      {formatCurrency(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {invoice.items?.map((item: any, index: number) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-400 mr-2">#{index + 1}</span>
                    <span className="text-sm text-gray-900">{item.description}</span>
                  </div>
                  <span className="font-bold text-gray-900 tabular-nums ml-3">
                    {formatCurrency(Number(item.amount))}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  SL: {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t-2 border-gray-300 bg-gray-50">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tong truoc thue:</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.subtotal))} VND</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({Number(invoice.vatRate)}%):</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.vatAmount))} VND</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2">
                <span className="text-gray-900">Tong cong:</span>
                <span className="text-gray-900 tabular-nums">
                  {formatCurrency(Number(invoice.grandTotal))} VND
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Hanh dong</h3>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('SENT')}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  Gui hoa don
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Xoa
                </button>
              </>
            )}

            {(invoice.status === 'SENT' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && (
              <button
                onClick={() => handleStatusUpdate('PAID')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Xac nhan thanh toan
              </button>
            )}

            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Huy hoa don
              </button>
            )}
          </div>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Xac nhan thanh toan</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">So tien</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(Number(invoice.grandTotal))} VND
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phuong thuc thanh toan
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chon...</option>
                    <option value="Chuyen khoan">Chuyen khoan</option>
                    <option value="Tien mat">Tien mat</option>
                    <option value="Khac">Khac</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ma tham chieu / So UNC
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="VD: UNC-123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                  >
                    Huy
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Dang xu ly...' : 'Xac nhan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
