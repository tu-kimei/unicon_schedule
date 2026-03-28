import { logout, useAuth } from 'wasp/client/auth';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  OPS: 'Vận hành',
  DISPATCHER: 'Điều phối',
  ACCOUNTING: 'Kế toán',
  DRIVER: 'Tài xế',
  CUSTOMER_OWNER: 'Chủ hàng',
  CUSTOMER_OPS: 'Vận hành KH',
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { data: user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) => {
    const base =
      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-colors duration-200 mx-2';
    return isActive(path)
      ? `${base} bg-primary-600 text-white font-medium shadow-sm`
      : `${base} text-primary-100 hover:bg-primary-700/50 hover:text-white`;
  };

  const sectionHeader = (label: string) => (
    <div className="pt-5 pb-1.5 px-4">
      <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#15642C] to-[#0D4A1F] shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="px-4 py-4 border-b border-primary-700/40">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 cursor-pointer" onClick={onClose}>
                <img
                  src="/unicon-logo.png"
                  alt="Unicon Logistics"
                  className="h-8 brightness-0 invert"
                />
                <span className="text-lg font-heading font-bold text-white tracking-tight">
                  Unicon
                </span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden text-primary-200 hover:text-white cursor-pointer transition-colors duration-200 p-1 rounded-md hover:bg-primary-700/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 sidebar-scroll">
            {user ? (
              <div className="space-y-0.5">
                {/* Customer Portal Section */}
                {(user.role === 'CUSTOMER_OPS' || user.role === 'CUSTOMER_OWNER') && (
                  <>
                    {/* Customer Dashboard */}
                    <Link to="/customer" className={navLinkClass('/customer')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Trang chủ</span>
                    </Link>

                    {/* My Shipments */}
                    <Link to="/customer/shipments" className={navLinkClass('/customer/shipments')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Chuyến hàng</span>
                    </Link>

                    {/* Create Request */}
                    <Link to="/customer/shipments/create" className={navLinkClass('/customer/shipments/create')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Tạo yêu cầu</span>
                    </Link>

                    {/* My Debts (CUSTOMER_OWNER only) */}
                    {user.role === 'CUSTOMER_OWNER' && (
                      <Link to="/customer/debts" className={navLinkClass('/customer/debts')} onClick={onClose}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Công nợ</span>
                      </Link>
                    )}
                  </>
                )}

                {/* Driver Portal */}
                {user.role === 'DRIVER' && (
                  <Link to="/driver" className={navLinkClass('/driver')} onClick={onClose}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span>Chuyến của tôi</span>
                  </Link>
                )}

                {/* Internal Users - Shipments */}
                {(user.role === 'OPS' || user.role === 'ADMIN' || user.role === 'DISPATCHER') && (
                  <Link to="/ops/shipments" className={navLinkClass('/ops/shipments')} onClick={onClose}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Chuyến hàng</span>
                  </Link>
                )}

                {/* Dispatch */}
                {(user.role === 'DISPATCHER' || user.role === 'ADMIN') && (
                  <Link to="/dispatcher" className={navLinkClass('/dispatcher')} onClick={onClose}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Điều phối</span>
                  </Link>
                )}

                {/* Accounting Section */}
                {(user.role === 'ACCOUNTING' || user.role === 'ADMIN') && (
                  <>
                    {sectionHeader('Kế toán')}

                    {/* Debts */}
                    <Link to="/accounting/debts" className={navLinkClass('/accounting/debts')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Công nợ</span>
                    </Link>

                    {/* Customers */}
                    <Link to="/accounting/customers" className={navLinkClass('/accounting/customers')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Khách hàng</span>
                    </Link>

                    {/* Invoices */}
                    <Link to="/accounting/invoices" className={navLinkClass('/accounting/invoices')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Hóa đơn</span>
                    </Link>
                  </>
                )}

                {/* Resources Section */}
                {(user.role === 'ADMIN' || user.role === 'OPS' || user.role === 'DISPATCHER') && (
                  <>
                    {sectionHeader('Tài nguyên')}

                    {/* Vehicles */}
                    <Link to="/resources/vehicles" className={navLinkClass('/resources/vehicles')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      <span>Phương tiện</span>
                    </Link>

                    {/* Drivers */}
                    <Link to="/resources/drivers" className={navLinkClass('/resources/drivers')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Tài xế</span>
                    </Link>
                  </>
                )}

                {/* Admin Section */}
                {user.role === 'ADMIN' && (
                  <>
                    {sectionHeader('Quản trị')}

                    {/* User Management */}
                    <Link to="/admin/users" className={navLinkClass('/admin/users')} onClick={onClose}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Quản lý người dùng</span>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                <Link to="/login" className={navLinkClass('/login')} onClick={onClose}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Đăng nhập</span>
                </Link>
                <Link to="/signup" className={navLinkClass('/signup')} onClick={onClose}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Info + Logout at bottom */}
          {user && (
            <div className="border-t border-primary-700/40 px-3 py-3">
              <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                  <p className="text-xs text-primary-300 truncate">
                    {roleLabels[user.role] || user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-primary-200 hover:bg-primary-700/50 hover:text-white rounded-lg cursor-pointer transition-colors duration-200"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          )}

          {/* Version info */}
          <div className="px-4 pb-3">
            <p className="text-[10px] text-primary-400/60 text-center">v1.0</p>
          </div>
        </div>

        {/* Custom scrollbar styles for dark sidebar */}
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.3);
          }
          .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
          }
        `}</style>
      </aside>
    </>
  );
};
