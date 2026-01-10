import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2 className={`animate-spin text-indigo-500 ${sizes[size]} ${className}`} />
  );
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ message = 'Loading...' }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
};

export { Spinner, LoadingOverlay, LoadingCard };
