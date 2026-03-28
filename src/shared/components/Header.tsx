import { useAuth } from 'wasp/client/auth';
import { NotificationBell } from './NotificationBell';

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  OPS: 'Vận hành',
  DISPATCHER: 'Điều phối',
  ACCOUNTING: 'Kế toán',
  DRIVER: 'Tài xế',
  CUSTOMER_OWNER: 'Chủ hàng',
  CUSTOMER_OPS: 'Vận hành KH',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Hamburger + Page title */}
        <div className="flex items-center gap-3">
          {/* Hamburger Button */}
          <button
            onClick={onMenuClick}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-1.5 cursor-pointer transition-colors duration-200 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo on mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/unicon-logo.png" alt="Unicon" className="h-8" />
          </div>

          {/* Page title area - desktop */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-heading font-semibold text-slate-800">
              Unicon Logistics
            </h1>
          </div>
        </div>

        {/* Right: Notifications + User Info */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {user && <NotificationBell />}

          {/* User Info (Desktop only) */}
          {user && (
            <div className="hidden lg:flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user.fullName}</p>
                <p className="text-xs text-slate-500">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-primary-600">
                <span className="text-sm font-semibold text-white">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
