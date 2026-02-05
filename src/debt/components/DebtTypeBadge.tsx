type DebtType = 'FREIGHT' | 'ADVANCE' | 'OTHER';

interface DebtTypeBadgeProps {
  type: DebtType;
}

export const DebtTypeBadge = ({ type }: DebtTypeBadgeProps) => {
  const config: Record<
    DebtType,
    { label: string; bgColor: string; textColor: string }
  > = {
    FREIGHT: {
      label: 'Cước vận chuyển',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    ADVANCE: {
      label: 'Chi hộ',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    OTHER: {
      label: 'Khác',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
  };

  const { label, bgColor, textColor } = config[type];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
};
