const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddingSizes = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-gray-900 border border-gray-800 rounded-xl
        ${hover ? 'hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/50 transition-all duration-300' : ''}
        ${paddingSizes[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-100 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-400 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-800 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
