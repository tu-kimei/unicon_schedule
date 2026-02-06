interface UserStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function UserStatusBadge({ isActive, className = '' }: UserStatusBadgeProps) {
  if (isActive) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100 ${className}`}
      >
        Active
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100 ${className}`}
    >
      Inactive
    </span>
  );
}
