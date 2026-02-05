import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllCustomers, createCustomer } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { CustomerFormModal, type CustomerFormData } from '../components/CustomerFormModal';

export const CustomersListPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời hạn công nợ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chốt bảng kê
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            {customer.hasVATInvoice && (
                              <div className="text-xs text-green-600 font-medium mt-1">#VAT</div>
                            )}
                          </div>
                          <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${customer.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {customer.paymentTermDays} {customer.paymentTermType === 'DAYS' ? 'ngày' : 'tháng'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {getStatementFrequencyLabel(customer.statementFrequency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/accounting/customers/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
                        </button>
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
                  className="block p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      {customer.hasVATInvoice && (
                        <div className="text-xs text-green-600 font-medium mt-1">#VAT</div>
                      )}
                    </div>
                    <span className="text-xs text-blue-600">Chi tiết →</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📧 {customer.email}</p>
                    {customer.phone && <p>📱 {customer.phone}</p>}
                    <p>
                      ⏰ {customer.paymentTermDays} {customer.paymentTermType === 'DAYS' ? 'ngày' : 'tháng'}
                    </p>
                    {customer.statementFrequency && (
                      <p>📋 {getStatementFrequencyLabel(customer.statementFrequency)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      <CustomerFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
};
