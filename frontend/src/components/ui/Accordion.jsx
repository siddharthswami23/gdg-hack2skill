import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Accordion = ({ children, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  );
};

const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
  icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="font-medium text-gray-200">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

Accordion.Item = AccordionItem;

export default Accordion;
