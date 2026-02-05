import React, { useState } from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  readOnly?: boolean;
  helperText?: string;
}

export const CurrencyInput = ({
  label,
  value,
  onChange,
  required,
  readOnly,
  helperText,
}: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState(formatNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  function formatNumber(num: number): string {
    if (num === 0) return '';
    return num.toLocaleString('vi-VN');
  }

  function parseNumber(str: string): number {
    // Remove all non-digit characters
    const cleaned = str.replace(/\D/g, '');
    return cleaned === '' ? 0 : parseInt(cleaned, 10);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseNumber(inputValue);
    
    onChange(numericValue);
    setDisplayValue(inputValue); // Keep user's input while typing
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format number when blur
    setDisplayValue(formatNumber(value));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? displayValue : formatNumber(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          readOnly={readOnly}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder="0"
        />
        <div className="absolute right-3 top-2 text-gray-500 text-sm pointer-events-none">
          VND
        </div>
      </div>
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};
