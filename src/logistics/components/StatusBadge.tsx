interface StatusBadgeProps {
  status: 'DRAFT' | 'READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const colors = {
    DRAFT: 'gray',
    READY: 'blue',
    ASSIGNED: 'yellow',
    IN_TRANSIT: 'orange',
    COMPLETED: 'green',
    CANCELLED: 'red'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      bg-${colors[status]}-100 text-${colors[status]}-800
      ${sizeClasses[size]}
    `}>
      {status.replace('_', ' ')}
    </span>
  );
};
