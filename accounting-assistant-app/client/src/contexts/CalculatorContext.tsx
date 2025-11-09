import React, { createContext, useContext, useState, useCallback } from 'react';
import { Calculator } from '../components/ui/Calculator';

interface CalculatorContextType {
  isOpen: boolean;
  openCalculator: () => void;
  closeCalculator: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCalculator = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCalculator = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Add keyboard shortcut for opening calculator
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        openCalculator();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [openCalculator]);

  // Listen for custom closeCalculator event
  React.useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('closeCalculator', handleClose);
    return () => window.removeEventListener('closeCalculator', handleClose);
  }, []);

  return (
    <CalculatorContext.Provider value={{ isOpen, openCalculator, closeCalculator }}>
      {children}
      {isOpen && <Calculator />}
    </CalculatorContext.Provider>
  );
};

export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
}; 