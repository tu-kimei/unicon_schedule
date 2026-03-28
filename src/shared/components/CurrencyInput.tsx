import { useState, useRef, useEffect } from 'react';

interface CurrencyInputProps {
  value: string | number;
  onChange: (rawValue: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  step?: string;
  /** suffix shown after the formatted number, e.g. "đ/L" */
  suffix?: string;
}

/**
 * Format a numeric string with Vietnamese-style dot separators.
 * 1000000 → 1.000.000
 * Preserves decimals: 12345.67 → 12.345,67
 */
function formatNumber(raw: string | number): string {
  const str = String(raw ?? '').replace(/[^\d.,-]/g, '');
  if (!str) return '';

  // Handle decimal part
  const parts = str.split('.');
  const intPart = parts[0].replace(/[^\d]/g, '');
  const decPart = parts.length > 1 ? parts[1].replace(/[^\d]/g, '') : null;

  if (!intPart && !decPart) return '';

  // Add dot separator to integer part
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decPart !== null) {
    return `${formatted},${decPart}`;
  }
  return formatted;
}

/**
 * Strip formatting back to raw number string.
 * 1.000.000 → 1000000
 * 12.345,67 → 12345.67
 */
function stripFormat(formatted: string): string {
  if (!formatted) return '';
  // Remove dot separators, replace comma with decimal point
  return formatted.replace(/\./g, '').replace(',', '.');
}

export const CurrencyInput = ({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder,
  step,
  suffix,
}: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState(() => formatNumber(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    const formatted = formatNumber(value);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: any) => {
    const raw = e.target.value;

    // Allow only digits, dots, and commas while typing
    const cleaned = raw.replace(/[^\d.,]/g, '');

    // Strip to raw number and reformat
    const rawNum = stripFormat(cleaned);
    const formatted = formatNumber(rawNum);

    setDisplayValue(formatted);
    onChange(rawNum);
  };

  const handleBlur = () => {
    // Reformat on blur to clean up
    const raw = stripFormat(displayValue);
    setDisplayValue(formatNumber(raw));
    onBlur?.();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
      />
      {suffix && displayValue && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default CurrencyInput;
