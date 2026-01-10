import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-gray-900 border border-gray-700 rounded-lg
          text-gray-100 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          px-4 py-2.5
          resize-y
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
