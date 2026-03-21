import { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { CustomerFormModal, type CustomerFormData } from '../components/CustomerFormModal';

// ============================================================================
// SVG Icons
// ============================================================================

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' }) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-500',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorStyles[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-80">{label}</div>
    </div>
  );
}

// ============================================================================
// Status filter type
// ============================================================================

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

// ============================================================================
// Main Component
// ============================================================================

export const CustomersListPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data: customers, isLoading, error, refetch } = useQuery(getAllCustomers);

  const handleCreateCustomer = async (data: CustomerFormData) => {
    try {
      await createCustomer(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEditCustomer = async (data: CustomerFormData) => {
    if (!editingCustomer) return;
    try {
      await updateCustomer({ id: editingCustomer.id, ...data });
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (customer: any) => {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${customer.name}"?`)) return;
    try {
      await deleteCustomer({ id: customer.id });
      refetch();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openEditModal = (customer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer: any) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // Stats
  const totalCustomers = customers?.length ?? 0;
  const activeCustomers = customers?.filter((c: any) => c.status === 'ACTIVE').length ?? 0;
  const inactiveCustomers = customers?.filter((c: any) => c.status === 'INACTIVE').length ?? 0;

  const getStatementFrequencyLabel = (frequency?: string) => {
    if (!frequency) return '-';
    const labels: Record<string, string> = {
      MONTHLY_25: '1 tháng 1 lần (ngày 25)',
      MONTHLY_30: '1 tháng 1 lần (ngày 30/31)',
      WEEKLY: '1 tuần 1 lần',
      BIMONTHLY: '1 tháng 2 lần (ngày 15 và 31)',
    };
    return labels[frequency] || frequency;
  };

  const getPaymentTermLabel = (customer: any) =>
    `${customer.paymentTermDays} ${customer.paymentTermType === 'DAYS' ? 'ngày' : 'tháng'}`;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Lỗi: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'ACTIVE', label: 'Đang hợp tác' },
    { key: 'INACTIVE', label: 'Ngưng hợp tác' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Khách hàng</h1>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Tạo khách hàng mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Tổng khách hàng" value={totalCustomers} color="blue" />
          <StatCard label="Đang hợp tác" value={activeCustomers} color="green" />
          <StatCard label="Ngưng hợp tác" value={inactiveCustomers} color="red" />
        </div>

        {/* Search with icon + clear */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter - Segmented Control */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            {statusFilters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Customers Table */}
        {!isLoading && filteredCustomers && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Công nợ / VAT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chốt bảng kê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer: any) => (
                    <tr
                      key={customer.id}
                      onClick={() => navigate(`/accounting/customers/${customer.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-xs text-gray-400 mt-0.5">{customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {getPaymentTermLabel(customer)}
                        </div>
                        {customer.hasVATInvoice && (
                          <span className="inline-block mt-0.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                            VAT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {getStatementFrequencyLabel(customer.statementFrequency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            customer.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                          {customer.status === 'ACTIVE' ? 'Đang hợp tác' : 'Ngưng hợp tác'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/accounting/customers/${customer.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Xem"
                          >
                            <EyeIcon />
                            <span className="hidden lg:inline">Xem</span>
                          </button>
                          <button
                            onClick={(e) => openEditModal(customer, e)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <PencilIcon />
                            <span className="hidden lg:inline">Sửa</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <TrashIcon />
                            <span className="hidden lg:inline">Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredCustomers.map((customer: any) => (
                <div
                  key={customer.id}
                  onClick={() => navigate(`/accounting/customers/${customer.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                >
                  {/* Top row: name + status + chevron */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          customer.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {customer.status === 'ACTIVE' ? 'Hợp tác' : 'Ngưng'}
                      </span>
                    </div>
                    <ChevronRightIcon />
                  </div>

                  {/* VAT badge */}
                  {customer.hasVATInvoice && (
                    <div className="mb-2">
                      <span className="inline-block text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                        VAT
                      </span>
                    </div>
                  )}

                  {/* Info rows with SVG icons */}
                  <div className="text-sm text-gray-600 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <MailIcon />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ClockIcon />
                      <span>{getPaymentTermLabel(customer)}</span>
                    </div>
                    {customer.statementFrequency && (
                      <div className="flex items-center gap-2">
                        <ClipboardIcon />
                        <span className="truncate">{getStatementFrequencyLabel(customer.statementFrequency)}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile action buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => openEditModal(customer, e)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                    >
                      <PencilIcon />
                      Sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <TrashIcon />
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'Không tìm thấy khách hàng nào phù hợp'
                  : 'Chưa có khách hàng nào'}
              </div>
            )}
          </div>
        )}

        {/* Result count */}
        {!isLoading && filteredCustomers && filteredCustomers.length > 0 && (
          <div className="mt-3 text-sm text-gray-500 text-right">
            Hiển thị {filteredCustomers.length} / {totalCustomers} khách hàng
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      <CustomerFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleEditCustomer}
          initialData={{
            name: editingCustomer.name,
            email: editingCustomer.email,
            phone: editingCustomer.phone || '',
            address: editingCustomer.address || '',
            paymentTermDays: editingCustomer.paymentTermDays,
            paymentTermType: editingCustomer.paymentTermType,
            statementFrequency: editingCustomer.statementFrequency,
            hasVATInvoice: editingCustomer.hasVATInvoice,
            invoiceName: editingCustomer.invoiceName || '',
            taxCode: editingCustomer.taxCode || '',
            taxAddress: editingCustomer.taxAddress || '',
            status: editingCustomer.status,
          }}
          isEdit
        />
      )}
    </div>
  );
};
