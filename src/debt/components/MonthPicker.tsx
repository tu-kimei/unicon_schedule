import { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
  label: string;
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  required?: boolean;
}

export const MonthPicker = ({ label, value, onChange, required }: MonthPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    value ? parseInt(value.split('-')[0]) : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    value ? parseInt(value.split('-')[1]) : new Date().getMonth() + 1
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const monthStr = String(month).padStart(2, '0');
    const newValue = `${selectedYear}-${monthStr}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const displayValue = value
    ? `${value.split('-')[1]}/${value.split('-')[0]}`
    : 'Chọn tháng';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Year Selector */}
          <div className="p-2 border-b">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-semibold"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  Năm {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2 p-2">
            {months.map((monthName, index) => {
              const monthNum = index + 1;
              const isSelected = selectedMonth === monthNum;
              const isCurrent =
                monthNum === new Date().getMonth() + 1 &&
                selectedYear === new Date().getFullYear();

              return (
                <button
                  key={monthNum}
                  type="button"
                  onClick={() => handleMonthSelect(monthNum)}
                  className={`
                    px-3 py-2 rounded text-sm font-medium transition-colors
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
