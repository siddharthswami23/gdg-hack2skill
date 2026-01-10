const severityStyles = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  default: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${severityStyles[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
