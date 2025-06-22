import React from 'react';
import type { UseFormRegister, FieldError } from 'react-hook-form';

interface TextAreaFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  register,
  error,
  placeholder,
  required = false,
  rows = 3,
  maxLength,
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        {...register(name)}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-none ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        }`}
      />
      {error && (
        <p 
          id={`${name}-error`}
          className="mt-1 text-xs text-red-600" 
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}; 