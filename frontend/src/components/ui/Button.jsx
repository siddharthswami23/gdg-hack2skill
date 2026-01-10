import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white border-transparent',
  outline: 'bg-transparent hover:bg-gray-800 text-gray-300 border-gray-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg border
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="w-4 h-4">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="w-4 h-4">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
