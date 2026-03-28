import { useState } from 'react';
import { useQuery, useAction } from 'wasp/client/operations';
import { getRepairLogs, updateRepairLogStatus, updateRepairLog, deleteRepairLog } from 'wasp/client/operations';

interface RepairLog {
  id: string;
  zaloMsgId: string | null;
  zaloGroupName: string | null;
  repairDate: string | null;
  entryDate: string;
  licensePlate: string;
  driverName: string | null;
  garageName: string | null;
  garageAddress: string | null;
  km: number | null;
  items: any[];
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
  repairDate: string;
  garageName: string;
  garageAddress: string;
  km: string;
  totalAmount: string;
  items: Array<{ name: string; amount: string }>;
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

export const RepairLogsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<RepairLog | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    licensePlate: '', driverName: '', repairDate: '', garageName: '', garageAddress: '', km: '',
    totalAmount: '', items: [], aiNotes: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(getRepairLogs, { status: statusFilter, page });
  const updateStatusFn = useAction(updateRepairLogStatus);
  const updateLogFn = useAction(updateRepairLog);
  const deleteLogFn = useAction(deleteRepairLog);

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

  const openEdit = (log: RepairLog) => {
    setEditingLog(log);
    setEditForm({
      licensePlate: log.licensePlate || '',
      driverName: log.driverName || '',
      repairDate: log.repairDate ? new Date(log.repairDate).toISOString().split('T')[0] : '',
      garageName: log.garageName || '',
      garageAddress: log.garageAddress || '',
      km: log.km != null ? String(log.km) : '',
      totalAmount: String(Number(log.totalAmount) || ''),
      items: Array.isArray(log.items) ? log.items.map((it: any) => ({
        name: it.name || String(it),
        amount: String(it.amount || 0),
      })) : [],
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
        repairDate: editForm.repairDate || null,
        garageName: editForm.garageName || null,
        garageAddress: editForm.garageAddress || null,
        km: editForm.km ? parseInt(editForm.km) : null,
        items: editForm.items.filter(i => i.name && i.amount),
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
        repairDate: editForm.repairDate || null,
        garageName: editForm.garageName || null,
        garageAddress: editForm.garageAddress || null,
        km: editForm.km ? parseInt(editForm.km) : null,
        items: editForm.items.filter(i => i.name && i.amount),
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

  const logs: RepairLog[] = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          🔧 Phiếu Sửa Chữa
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{total} phiếu</span>
        </h1>
        <p className="text-gray-500 mt-1">Quản lý và duyệt phiếu sửa chữa từ Zalo OCR</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garage</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">KM</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hạng mục</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
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
                      <div className="text-gray-900">{formatDate(log.repairDate)}</div>
                      <div className="text-xs text-gray-400">GN: {formatDateTime(log.entryDate)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.garageName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{log.km ? Number(log.km).toLocaleString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.items && log.items.length > 0 ? (
                        <div className="text-xs">
                          {log.items.slice(0, 2).map((it: any, i: number) => (
                            <div key={i}>{it.name || '—'}: <span className="text-gray-500">{it.amount ? formatCurrency(Number(it.amount)) : ''}</span></div>
                          ))}
                          {log.items.length > 2 && <div className="text-gray-400">+{log.items.length - 2} hạng mục</div>}
                        </div>
                      ) : '-'}
                    </td>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[log.status]}`}>
                        {statusLabels[log.status] || log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(log)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100"
                          title="Chỉnh sửa">✏️ Sửa</button>
                        {log.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(log.id)}
                              className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded hover:bg-green-100"
                              title="Phê duyệt">✓ Duyệt</button>
                            <button onClick={() => handleReject(log.id)}
                              className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded hover:bg-orange-100"
                              title="Từ chối">✗ Từ chối</button>
                          </>
                        )}
                        <button onClick={() => setDeleteConfirm(log.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100"
                          title="Xóa">🗑</button>
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
                  className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">🗑 Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" onClick={() => setEditingLog(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900">✏️ Chỉnh sửa phiếu sửa chữa</h3>
              <button onClick={() => setEditingLog(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
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
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🚛 Biển số xe *</label>
                  <input type="text" value={editForm.licensePlate}
                    onChange={e => setEditForm(f => ({ ...f, licensePlate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">👤 Tài xế</label>
                  <input type="text" value={editForm.driverName}
                    onChange={e => setEditForm(f => ({ ...f, driverName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📅 Ngày sửa</label>
                  <input type="date" value={editForm.repairDate}
                    onChange={e => setEditForm(f => ({ ...f, repairDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🔢 Số km</label>
                  <input type="number" value={editForm.km}
                    onChange={e => setEditForm(f => ({ ...f, km: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🏭 Garage</label>
                  <input type="text" value={editForm.garageName}
                    onChange={e => setEditForm(f => ({ ...f, garageName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📍 Địa chỉ</label>
                  <input type="text" value={editForm.garageAddress}
                    onChange={e => setEditForm(f => ({ ...f, garageAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📋 Hạng mục sửa chữa</label>
                <div className="space-y-2">
                  {editForm.items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder="Tên hạng mục" value={item.name}
                        onChange={e => {
                          const newItems = [...editForm.items];
                          newItems[i].name = e.target.value;
                          setEditForm(f => ({ ...f, items: newItems }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <div className="w-40">
                        <input type="number" placeholder="Tiền" value={item.amount} step="1"
                          onChange={e => {
                            const newItems = [...editForm.items];
                            newItems[i].amount = e.target.value;
                            setEditForm(f => ({ ...f, items: newItems }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <div className="text-xs text-blue-500 mt-0.5">{parseFloat(item.amount) ? fmtVND(item.amount) : ''}</div>
                      </div>
                      <button onClick={() => {
                        setEditForm(f => ({
                          ...f,
                          items: f.items.filter((_, j) => j !== i),
                        }));
                      }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">🗑</button>
                    </div>
                  ))}
                  <button onClick={() => setEditForm(f => ({ ...f, items: [...f.items, { name: '', amount: '' }] }))}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200">+ Thêm</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">💵 Tổng tiền</label>
                <input type="number" step="1" value={editForm.totalAmount}
                  onChange={e => setEditForm(f => ({ ...f, totalAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <div className="text-xs text-green-600 font-medium mt-1">{parseFloat(editForm.totalAmount) ? fmtVND(editForm.totalAmount) : ''}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📝 Ghi chú AI</label>
                <textarea value={editForm.aiNotes}
                  onChange={e => setEditForm(f => ({ ...f, aiNotes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[editingLog.status]}`}>
                  {statusLabels[editingLog.status]}
                </span>
                {editingLog.confidence && (
                  <span className="text-sm text-gray-500 ml-2">Confidence: {(Number(editingLog.confidence) * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl flex items-center justify-between">
              <button onClick={() => setDeleteConfirm(editingLog.id)}
                className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded-lg hover:bg-red-100">🗑 Xóa</button>
              <div className="flex gap-2">
                <button onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '...' : '💾 Lưu'}
                </button>
                {(editingLog.status === 'pending' || editingLog.status === 'rejected') && (
                  <button onClick={handleSaveAndApprove} disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
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
