import React from 'react';
import { Calculator } from 'lucide-react';

interface CalculatorButtonProps {
  onClick: () => void;
  className?: string;
}

export const CalculatorButton: React.FC<CalculatorButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm transition-colors ${className}`}
      title="Open Calculator (Ctrl + K)"
    >
      <Calculator size={16} />
      <span>Calculator</span>
    </button>
  );
}; 