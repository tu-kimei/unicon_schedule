type UserType = 'INTERNAL' | 'CUSTOMER';

interface UserTypeBadgeProps {
  userType: UserType;
  className?: string;
}

export function UserTypeBadge({ userType, className = '' }: UserTypeBadgeProps) {
  if (userType === 'INTERNAL') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-50 ${className}`}
      >
        Internal
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-700 bg-orange-50 ${className}`}
    >
      Customer
    </span>
  );
}
