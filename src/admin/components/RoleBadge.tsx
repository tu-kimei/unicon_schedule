type UserRole = 'ADMIN' | 'ACCOUNTING' | 'OPS' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER_OWNER' | 'CUSTOMER_OPS';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  ADMIN: { label: 'Admin', color: 'text-red-700', bgColor: 'bg-red-100' },
  ACCOUNTING: { label: 'Accounting', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  OPS: { label: 'Operations', color: 'text-green-700', bgColor: 'bg-green-100' },
  DISPATCHER: { label: 'Dispatcher', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  DRIVER: { label: 'Driver', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  CUSTOMER_OWNER: { label: 'Customer Owner', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  CUSTOMER_OPS: { label: 'Customer Ops', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
};

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
