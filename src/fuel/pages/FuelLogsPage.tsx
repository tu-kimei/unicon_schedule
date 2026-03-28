import { useState } from 'react';
import { useQuery, useAction } from 'wasp/client/operations';
import { getFuelLogs, updateFuelLogStatus, updateFuelLog, deleteFuelLog } from 'wasp/client/operations';

interface FuelLog {
  id: string;
  zaloMsgId: string | null;
  zaloGroupName: string | null;
  fuelDate: string | null;
  entryDate: string;
  licensePlate: string;
  driverName: string | null;
  liters: number;
  unitPrice: number;
  totalAmount: number;
  imageUrls: string[];
  confidence: number | null;
  aiNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface EditForm {
  licensePlate: string;
  driverName: string;
  fuelDate: string;
  liters: string;
  unitPrice: string;
  totalAmount: string;
  aiNotes: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const FuelLogsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    licensePlate: '', driverName: '', fuelDate: '', liters: '', unitPrice: '', totalAmount: '', aiNotes: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(getFuelLogs, { status: statusFilter, page });
  const updateStatusFn = useAction(updateFuelLogStatus);
  const updateLogFn = useAction(updateFuelLog);
  const deleteLogFn = useAction(deleteFuelLog);

  // ─── Actions ─────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    try {
      await updateStatusFn({ id, status: 'confirmed' });
      refetch();
    } catch (e) { console.error('Failed to approve:', e); }
  };

  const handleReject = async (id: string) => {
    try {
      await updateStatusFn({ id, status: 'rejected' });
      refetch();
    } catch (e) { console.error('Failed to reject:', e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLogFn({ id });
      setDeleteConfirm(null);
      refetch();
    } catch (e) { console.error('Failed to delete:', e); }
  };

  const openEdit = (log: FuelLog) => {
    setEditingLog(log);
    setEditForm({
      licensePlate: log.licensePlate || '',
      driverName: log.driverName || '',
      fuelDate: log.fuelDate ? new Date(log.fuelDate).toISOString().split('T')[0] : '',
      liters: String(Number(log.liters) || ''),
      unitPrice: String(Number(log.unitPrice) || ''),
      totalAmount: String(Number(log.totalAmount) || ''),
      aiNotes: log.aiNotes || '',
    });
  };

  const handleSave = async () => {
    if (!editingLog) return;
    setSaving(true);
    try {
      await updateLogFn({
        id: editingLog.id,
        licensePlate: editForm.licensePlate,
        driverName: editForm.driverName || null,
        fuelDate: editForm.fuelDate || null,
        liters: parseFloat(editForm.liters) || 0,
        unitPrice: parseFloat(editForm.unitPrice) || 0,
        totalAmount: parseFloat(editForm.totalAmount) || 0,
        aiNotes: editForm.aiNotes || null,
      });
      setEditingLog(null);
      refetch();
    } catch (e) {
      console.error('Failed to save:', e);
      alert('Lỗi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndApprove = async () => {
    if (!editingLog) return;
    setSaving(true);
    try {
      await updateLogFn({
        id: editingLog.id,
        licensePlate: editForm.licensePlate,
        driverName: editForm.driverName || null,
        fuelDate: editForm.fuelDate || null,
        liters: parseFloat(editForm.liters) || 0,
        unitPrice: parseFloat(editForm.unitPrice) || 0,
        totalAmount: parseFloat(editForm.totalAmount) || 0,
        aiNotes: editForm.aiNotes || null,
      });
      await updateStatusFn({ id: editingLog.id, status: 'confirmed' });
      setEditingLog(null);
      refetch();
    } catch (e) {
      console.error('Failed to save and approve:', e);
      alert('Lỗi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const recalcTotal = () => {
    const l = parseFloat(editForm.liters) || 0;
    const p = parseFloat(editForm.unitPrice) || 0;
    setEditForm(f => ({ ...f, totalAmount: String(Math.round(l * p)) }));
  };

  // ─── Formatters ──────────────────────────────────────────
  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  const fmtVND = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
    return formatCurrency(num);
  };
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">Lỗi tải dữ liệu: {error.message}</div>
      </div>
    );
  }

  const logs: FuelLog[] = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          ⛽ Phiếu Đổ Dầu
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{total} phiếu</span>
        </h1>
        <p className="text-gray-500 mt-1">Quản lý và duyệt phiếu đổ dầu từ Zalo OCR</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'pending', label: '🟡 Chờ duyệt' },
          { value: 'confirmed', label: '🟢 Đã duyệt' },
          { value: 'rejected', label: '🔴 Từ chối' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Không có phiếu nào</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biển số</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tài xế</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lít</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ảnh</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.licensePlate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.driverName || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{formatDate(log.fuelDate)}</div>
                      <div className="text-xs text-gray-400">GN: {formatDateTime(log.entryDate)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{Number(log.liters).toLocaleString('vi-VN')} L</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(Number(log.unitPrice))}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(Number(log.totalAmount))}</td>
                    <td className="px-4 py-3 text-center">
                      {log.imageUrls && log.imageUrls.length > 0 ? (
                        <div className="flex justify-center gap-1">
                          {log.imageUrls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt={`Ảnh ${i + 1}`}
                              className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setSelectedImage(url)} />
                          ))}
                          {log.imageUrls.length > 3 && <span className="text-xs text-gray-500">+{log.imageUrls.length - 3}</span>}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[log.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[log.status] || log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {/* Edit button - always visible */}
                        <button onClick={() => openEdit(log)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 transition-colors"
                          title="Chỉnh sửa">
                          ✏️ Sửa
                        </button>
                        {/* Approve/Reject - only for pending */}
                        {log.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(log.id)}
                              className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded hover:bg-green-100 transition-colors"
                              title="Phê duyệt">
                              ✓ Duyệt
                            </button>
                            <button onClick={() => handleReject(log.id)}
                              className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded hover:bg-orange-100 transition-colors"
                              title="Từ chối">
                              ✗ Từ chối
                            </button>
                          </>
                        )}
                        {/* Delete button - always */}
                        <button onClick={() => setDeleteConfirm(log.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                          title="Xóa">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">Trang {page} / {totalPages} ({total} phiếu)</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">← Trước</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">Sau →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Delete Confirm Dialog ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-6">Bạn chắc chắn muốn xóa phiếu này?<br />Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                  🗑 Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingLog(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900">✏️ Chỉnh sửa phiếu đổ dầu</h3>
              <button onClick={() => setEditingLog(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Images */}
            {editingLog.imageUrls && editingLog.imageUrls.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-b">
                <div className="flex gap-2 overflow-x-auto">
                  {editingLog.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Ảnh ${i + 1}`}
                      className="h-24 w-auto rounded cursor-pointer hover:opacity-80 flex-shrink-0"
                      onClick={() => setSelectedImage(url)} />
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🚛 Biển số xe *</label>
                  <input type="text" value={editForm.licensePlate}
                    onChange={e => setEditForm(f => ({ ...f, licensePlate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">👤 Tài xế</label>
                  <input type="text" value={editForm.driverName}
                    onChange={e => setEditForm(f => ({ ...f, driverName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📅 Ngày đổ dầu</label>
                <input type="date" value={editForm.fuelDate}
                  onChange={e => setEditForm(f => ({ ...f, fuelDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">⛽ Số lít</label>
                  <input type="number" step="0.001" value={editForm.liters}
                    onChange={e => setEditForm(f => ({ ...f, liters: e.target.value }))}
                    onBlur={recalcTotal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <div className="text-xs text-blue-500 mt-1">{parseFloat(editForm.liters) ? `${Number(parseFloat(editForm.liters)).toLocaleString('vi-VN')} L` : ''}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">💰 Đơn giá (đ/L)</label>
                  <input type="number" step="1" value={editForm.unitPrice}
                    onChange={e => setEditForm(f => ({ ...f, unitPrice: e.target.value }))}
                    onBlur={recalcTotal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <div className="text-xs text-blue-500 mt-1">{parseFloat(editForm.unitPrice) ? fmtVND(editForm.unitPrice) + '/L' : ''}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">💵 Thành tiền</label>
                  <input type="number" step="1" value={editForm.totalAmount}
                    onChange={e => setEditForm(f => ({ ...f, totalAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <div className="text-xs text-green-600 font-medium mt-1">{parseFloat(editForm.totalAmount) ? fmtVND(editForm.totalAmount) : ''}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📝 Ghi chú AI</label>
                <textarea value={editForm.aiNotes}
                  onChange={e => setEditForm(f => ({ ...f, aiNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[editingLog.status]}`}>
                  {statusLabels[editingLog.status]}
                </span>
                {editingLog.confidence && (
                  <span className="text-sm text-gray-500 ml-2">
                    Confidence: {(Number(editingLog.confidence) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl flex items-center justify-between">
              <button onClick={() => setDeleteConfirm(editingLog.id)}
                className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded-lg hover:bg-red-100 transition-colors">
                🗑 Xóa
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? '...' : '💾 Lưu'}
                </button>
                {(editingLog.status === 'pending' || editingLog.status === 'rejected') && (
                  <button onClick={handleSaveAndApprove} disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {saving ? '...' : '✅ Lưu & Phê duyệt'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Image Lightbox ─── */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]" onClick={() => setSelectedImage(null)}>
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <div className="text-center mt-2">
              <a href={selectedImage} target="_blank" rel="noopener noreferrer"
                className="text-white underline text-sm" onClick={e => e.stopPropagation()}>Mở tab mới</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
