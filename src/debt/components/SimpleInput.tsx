import React from 'react';

interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export const SimpleInput = React.forwardRef<HTMLInputElement, SimpleInputProps>(
  function SimpleInput({ className, label, helperText, ...props }, ref) {
    const id = React.useId();
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          id={id}
          className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ''}`}
          {...props}
          ref={ref}
        />
        {helperText && <span className="text-xs text-gray-500">{helperText}</span>}
      </div>
    );
  }
);
