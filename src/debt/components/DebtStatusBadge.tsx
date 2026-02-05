type DebtStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface DebtStatusBadgeProps {
  status: DebtStatus;
}

export const DebtStatusBadge = ({ status }: DebtStatusBadgeProps) => {
  const config: Record<
    DebtStatus,
    { label: string; bgColor: string; textColor: string }
  > = {
    UNPAID: {
      label: 'Chưa thanh toán',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    PAID: {
      label: 'Đã thanh toán',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    OVERDUE: {
      label: 'Quá hạn',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    CANCELLED: {
      label: 'Đã hủy',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
  };

  const { label, bgColor, textColor } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
};
