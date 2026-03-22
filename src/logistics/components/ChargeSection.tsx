import { useState } from 'react';
import { createCharge, updateCharge, deleteCharge } from 'wasp/client/operations';

// ============================================================================
// Types & Constants
// ============================================================================

type ChargeType =
  | 'FREIGHT'
  | 'FUEL_SURCHARGE'
  | 'DETENTION'
  | 'DEMURRAGE'
  | 'LOADING'
  | 'UNLOADING'
  | 'CUSTOMS'
  | 'TOLL_FEE'
  | 'PARKING'
  | 'INSURANCE'
  | 'OTHER';

const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  FREIGHT: 'Cuoc van chuyen',
  FUEL_SURCHARGE: 'Phu phi nhien lieu',
  DETENTION: 'Phi luu container',
  DEMURRAGE: 'Phi luu bai',
  LOADING: 'Phi boc xep',
  UNLOADING: 'Phi do hang',
  CUSTOMS: 'Phi hai quan',
  TOLL_FEE: 'Phi cau duong',
  PARKING: 'Phi do xe',
  INSURANCE: 'Phi bao hiem',
  OTHER: 'Chi phi khac',
};

// Vietnamese labels with diacritics for display
const CHARGE_TYPE_LABELS_VI: Record<ChargeType, string> = {
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

const CHARGE_TYPES: ChargeType[] = [
  'FREIGHT',
  'FUEL_SURCHARGE',
  'DETENTION',
  'DEMURRAGE',
  'LOADING',
  'UNLOADING',
  'CUSTOMS',
  'TOLL_FEE',
  'PARKING',
  'INSURANCE',
  'OTHER',
];

interface Charge {
  id: string;
  chargeType: ChargeType;
  description: string | null;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
  invoiceItem?: any;
}

interface ChargeSectionProps {
  shipmentId: string;
  charges: Charge[];
  onRefresh: () => void;
  canEdit?: boolean;
}

// ============================================================================
// Format helpers
// ============================================================================

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('vi-VN').format(Number(amount));
};

// ============================================================================
// Charge Form Modal
// ============================================================================

function ChargeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    chargeType: ChargeType;
    description: string;
    quantity: number;
    unitPrice: number;
  }) => Promise<void>;
  initialData?: Charge | null;
}) {
  const [chargeType, setChargeType] = useState<ChargeType>(initialData?.chargeType || 'FREIGHT');
  const [description, setDescription] = useState(initialData?.description || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice ? Number(initialData.unitPrice).toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const calculatedAmount = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        chargeType,
        description,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Chnh sa chi ph' : 'Them chi ph'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loai chi ph <span className="text-red-500">*</span>
            </label>
            <select
              value={chargeType}
              onChange={(e) => setChargeType(e.target.value as ChargeType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CHARGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CHARGE_TYPE_LABELS_VI[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mo ta
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi ch them..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                So luong <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Don gia (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Thanh tien:</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(calculatedAmount)} VND
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !unitPrice}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Dang xu ly...' : initialData ? 'Cap nhat' : 'Them'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ChargeSection Component
// ============================================================================

export const ChargeSection = ({ shipmentId, charges, onRefresh, canEdit = true }: ChargeSectionProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);

  const totalAmount = charges.reduce((sum, c) => sum + Number(c.amount), 0);

  const handleCreate = async (data: {
    chargeType: ChargeType;
    description: string;
    quantity: number;
    unitPrice: number;
  }) => {
    await createCharge({
      shipmentId,
      chargeType: data.chargeType,
      description: data.description || undefined,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
    });
    onRefresh();
  };

  const handleUpdate = async (data: {
    chargeType: ChargeType;
    description: string;
    quantity: number;
    unitPrice: number;
  }) => {
    if (!editingCharge) return;
    await updateCharge({
      chargeId: editingCharge.id,
      chargeType: data.chargeType,
      description: data.description || undefined,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
    });
    setEditingCharge(null);
    onRefresh();
  };

  const handleDelete = async (charge: Charge) => {
    if (!confirm('Ban co chac chan muon xoa chi phi nay?')) return;
    try {
      await deleteCharge({ chargeId: charge.id });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Chi ph</h3>
          {canEdit && (
            <button
              onClick={() => {
                setEditingCharge(null);
                setIsFormOpen(true);
              }}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
            >
              + Them chi ph
            </button>
          )}
        </div>
      </div>

      {charges.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          Chua co chi ph nao
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Loai
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
                  {canEdit && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Hanh dong
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                        {CHARGE_TYPE_LABELS_VI[charge.chargeType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {charge.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                      {charge.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                      {formatCurrency(charge.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold tabular-nums">
                      {formatCurrency(charge.amount)}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingCharge(charge);
                              setIsFormOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded"
                          >
                            Sua
                          </button>
                          {!charge.invoiceItem && (
                            <button
                              onClick={() => handleDelete(charge)}
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                            >
                              Xoa
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td
                    colSpan={canEdit ? 4 : 4}
                    className="px-4 py-3 text-sm font-bold text-gray-900 text-right"
                  >
                    Tong cong:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">
                    {formatCurrency(totalAmount)} VND
                  </td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {charges.map((charge) => (
              <div key={charge.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                    {CHARGE_TYPE_LABELS_VI[charge.chargeType]}
                  </span>
                  <span className="font-bold text-gray-900 tabular-nums">
                    {formatCurrency(charge.amount)} VND
                  </span>
                </div>
                {charge.description && (
                  <p className="text-sm text-gray-600 mb-1">{charge.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>SL: {charge.quantity}</span>
                  <span>Don gia: {formatCurrency(charge.unitPrice)}</span>
                </div>
                {canEdit && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingCharge(charge);
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-center text-primary-700 bg-primary-50 hover:bg-primary-100 rounded"
                    >
                      Sua
                    </button>
                    {!charge.invoiceItem && (
                      <button
                        onClick={() => handleDelete(charge)}
                        className="flex-1 py-1.5 text-xs font-medium text-center text-red-600 bg-red-50 hover:bg-red-100 rounded"
                      >
                        Xoa
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Total */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Tong cong:</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(totalAmount)} VND
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Charge Modal */}
      <ChargeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCharge(null);
        }}
        onSubmit={editingCharge ? handleUpdate : handleCreate}
        initialData={editingCharge}
      />
    </div>
  );
};
