import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAllDebts } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { Link } from 'react-router-dom';

type StatusFilter = 'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE';

function StatCard({ label, value, color, subtext }: { label: string; value: string | number; color: 'blue' | 'green' | 'red' | 'yellow' | 'gray'; subtext?: string }) {
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
      {subtext && <div className="text-xs mt-1 opacity-60">{subtext}</div>}
    </div>
  );
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDebtType = (type: string) => {
  switch (type) {
    case 'FREIGHT': return 'Cuoc van chuyen';
    case 'ADVANCE': return 'Chi ho';
    case 'OTHER': return 'Khac';
    default: return type;
  }
};

const formatDebtTypeVi = (type: string) => {
  switch (type) {
    case 'FREIGHT': return 'C\u01B0\u1EDBc v\u1EADn chuy\u1EC3n';
    case 'ADVANCE': return 'Chi h\u1ED9';
    case 'OTHER': return 'Kh\u00E1c';
    default: return type;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'UNPAID': return 'Ch\u01B0a TT';
    case 'PAID': return '\u0110\u00E3 TT';
    case 'OVERDUE': return 'Qu\u00E1 h\u1EA1n';
    case 'CANCELLED': return '\u0110\u00E3 h\u1EE7y';
    default: return status;
  }
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'UNPAID': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'PAID': return 'bg-green-100 text-green-800 border border-green-300';
    case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-300';
    case 'CANCELLED': return 'bg-gray-100 text-gray-500 border border-gray-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const MyDebtsPage = () => {
  const { data: user } = useAuth();
  const { data: allDebts, isLoading } = useQuery(getAllDebts);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Filter debts for current customer only
  const myDebts = allDebts?.filter((debt: any) => debt.customer.id === user?.customerId) || [];

  // Apply status filter
  const filteredDebts = statusFilter === 'ALL'
    ? myDebts
    : myDebts.filter((d: any) => d.status === statusFilter);

  // Calculate totals
  const totalUnpaid = myDebts
    .filter((d: any) => d.status === 'UNPAID' || d.status === 'OVERDUE')
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  const totalOverdue = myDebts
    .filter((d: any) => d.status === 'OVERDUE')
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  const totalPaid = myDebts
    .filter((d: any) => d.status === 'PAID')
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  // Check if user is CUSTOMER_OWNER
  if (user?.role !== 'CUSTOMER_OWNER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-gray-600 mb-2">Kh\u00F4ng c\u00F3 quy\u1EC1n truy c\u1EADp</p>
          <p className="text-sm text-gray-500">Ch\u1EC9 Ch\u1EE7 h\u00E0ng m\u1EDBi c\u00F3 th\u1EC3 xem c\u00F4ng n\u1EE3</p>
          <Link to="/customer" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            \u2190 Quay l\u1EA1i trang ch\u1EE7
          </Link>
        </div>
      </div>
    );
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'T\u1EA5t c\u1EA3' },
    { key: 'UNPAID', label: 'Ch\u01B0a TT' },
    { key: 'PAID', label: '\u0110\u00E3 TT' },
    { key: 'OVERDUE', label: 'Qu\u00E1 h\u1EA1n' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">C\u00F4ng n\u1EE3 c\u1EE7a t\u00F4i</h1>
          <p className="text-gray-600 mt-1">Xem v\u00E0 theo d\u00F5i c\u00E1c kho\u1EA3n thanh to\u00E1n</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="T\u1ED5ng c\u00F4ng n\u1EE3"
            value={myDebts.length}
            color="blue"
            subtext={`${myDebts.filter((d: any) => d.status === 'UNPAID').length} ch\u01B0a TT`}
          />
          <StatCard
            label="Ch\u01B0a thanh to\u00E1n"
            value={formatCurrency(totalUnpaid)}
            color="yellow"
          />
          <StatCard
            label="Qu\u00E1 h\u1EA1n"
            value={formatCurrency(totalOverdue)}
            color="red"
            subtext={totalOverdue > 0 ? 'C\u1EA7n thanh to\u00E1n ngay' : undefined}
          />
          <StatCard
            label="\u0110\u00E3 thanh to\u00E1n"
            value={formatCurrency(totalPaid)}
            color="green"
          />
        </div>

        {/* Status Filter - Segmented Control */}
        <div className="bg-white rounded-lg shadow mb-4 p-1 inline-flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Debts List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">\u0110ang t\u1EA3i...</p>
          </div>
        ) : filteredDebts.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Th\u00E1ng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lo\u1EA1i
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S\u1ED1 ti\u1EC1n
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      H\u1EA1n thanh to\u00E1n
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tr\u1EA1ng th\u00E1i
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDebts.map((debt: any) => (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {debt.debtMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDebtTypeVi(debt.debtType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(Number(debt.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(debt.status)}`}>
                          {statusLabel(debt.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredDebts.map((debt: any) => (
                <div key={debt.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{debt.debtMonth}</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(debt.status)}`}>
                      {statusLabel(debt.status)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {formatCurrency(Number(debt.amount))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDebtTypeVi(debt.debtType)}</span>
                    <span>H\u1EA1n: {new Date(debt.dueDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {debt.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{debt.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Result Count */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              Hi\u1EC3n th\u1ECB {filteredDebts.length} / {myDebts.length} c\u00F4ng n\u1EE3
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">
              {statusFilter === 'ALL' ? 'Kh\u00F4ng c\u00F3 c\u00F4ng n\u1EE3' : 'Kh\u00F4ng c\u00F3 c\u00F4ng n\u1EE3 n\u00E0o'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter === 'ALL'
                ? 'B\u1EA1n kh\u00F4ng c\u00F3 c\u00F4ng n\u1EE3 n\u00E0o'
                : 'Kh\u00F4ng t\u00ECm th\u1EA5y c\u00F4ng n\u1EE3 v\u1EDBi tr\u1EA1ng th\u00E1i n\u00E0y'}
            </p>
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-blue-600 hover:text-blue-700 mt-3 text-sm inline-block"
              >
                Xem t\u1EA5t c\u1EA3 c\u00F4ng n\u1EE3
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
