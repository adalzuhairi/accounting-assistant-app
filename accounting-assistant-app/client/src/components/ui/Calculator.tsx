import React, { useState, useEffect } from 'react';
import { X, Copy, History } from 'lucide-react';

interface Calculation {
  expression: string;
  result: number;
  timestamp: Date;
}

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<Calculation[]>([]);

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (operator: string) => {
    setExpression(display + ' ' + operator + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      const result = eval(expression + display);
      const newCalculation: Calculation = {
        expression: expression + display,
        result: result,
        timestamp: new Date()
      };
      setHistory(prev => [newCalculation, ...prev].slice(0, 5));
      setDisplay(result.toString());
      setExpression('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handlePercentage = () => {
    const currentValue = parseFloat(display);
    const percentageValue = currentValue / 100;
    setDisplay(percentageValue.toString());
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' && event.ctrlKey) {
        copyToClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [display]);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Calculator</h3>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('closeCalculator'))}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Display */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <div className="text-sm text-gray-500">{expression}</div>
          <div className="text-2xl font-mono text-right">{display}</div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <History size={16} />
              <span className="text-sm font-medium">History</span>
            </div>
            {history.map((calc, index) => (
              <div key={index} className="text-sm text-gray-600 mb-1">
                {calc.expression} = {calc.result}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleClear}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            C
          </button>
          <button
            onClick={() => handleOperator('/')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            ÷
          </button>
          <button
            onClick={() => handleOperator('*')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            ×
          </button>
          <button
            onClick={() => copyToClipboard()}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            <Copy size={16} />
          </button>

          {[7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            -
          </button>

          {[4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('+')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            +
          </button>

          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleEqual}
            className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded row-span-2"
          >
            =
          </button>

          <button
            onClick={() => handleNumber('0')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded col-span-2"
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            .
          </button>
          <button
            onClick={handlePercentage}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            %
          </button>
        </div>
      </div>
    </div>
  );
}; 