import { logout, useAuth } from 'wasp/client/auth';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import { Button } from './Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { data: user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) => {
    const base = 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors';
    return isActive(path)
      ? `${base} bg-blue-100 text-blue-700 font-medium`
      : `${base} text-gray-700 hover:bg-gray-100`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2" onClick={onClose}>
                <img src={Logo} alt="Unicon Schedule" className="h-8 w-8" />
                <span className="text-lg font-semibold text-gray-900">Unicon</span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {user ? (
              <div className="space-y-1">
                {/* Shipments */}
                <Link to="/" className={navLinkClass('/')} onClick={onClose}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Shipments</span>
                </Link>

                {/* Dispatch */}
                {(user.role === 'DISPATCHER' || user.role === 'ADMIN') && (
                  <Link to="/dispatcher" className={navLinkClass('/dispatcher')} onClick={onClose}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Dispatch</span>
                  </Link>
                )}

                {/* Accounting Section */}
                {(user.role === 'ACCOUNTING' || user.role === 'ADMIN' || user.role === 'OPS') && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Kế toán
                      </p>
                    </div>

                    {/* Debts */}
                    <Link to="/accounting/debts" className={navLinkClass('/accounting/debts')} onClick={onClose}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Công nợ</span>
                    </Link>

                    {/* Customers */}
                    <Link to="/accounting/customers" className={navLinkClass('/accounting/customers')} onClick={onClose}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Khách hàng</span>
                    </Link>
                  </>
                )}

                {/* Resources Section */}
                {(user.role === 'ADMIN' || user.role === 'OPS' || user.role === 'DISPATCHER') && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tài nguyên
                      </p>
                    </div>

                    {/* Vehicles */}
                    <Link to="/resources/vehicles" className={navLinkClass('/resources/vehicles')} onClick={onClose}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      <span>Phương tiện</span>
                    </Link>

                    {/* Drivers */}
                    <Link to="/resources/drivers" className={navLinkClass('/resources/drivers')} onClick={onClose}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Tài xế</span>
                    </Link>
                  </>
                )}

                {/* Admin Section */}
                {user.role === 'ADMIN' && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quản trị
                      </p>
                    </div>

                    {/* User Management */}
                    <Link to="/admin/users" className={navLinkClass('/admin/users')} onClick={onClose}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Quản lý Users</span>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Link to="/login" className={navLinkClass('/login')} onClick={onClose}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </Link>
                <Link to="/signup" className={navLinkClass('/signup')} onClick={onClose}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Sign up</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Logout Button */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  logout();
                  onClose();
                }}
                variant="danger"
                className="w-full justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
