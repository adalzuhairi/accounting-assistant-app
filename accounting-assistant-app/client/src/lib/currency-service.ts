import * as currencyFormatter from 'currency-formatter';
import { Dinero, dinero, toDecimal, add, subtract, multiply } from 'dinero.js';
import { USD } from '@dinero.js/currencies';

// List of supported currencies
export const supportedCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
];

// Get currency details by code
export const getCurrencyByCode = (code: string) => {
  return supportedCurrencies.find(c => c.code === code) || supportedCurrencies[0];
};

// Format amount in a specific currency
export const formatCurrency = (amount: number, currencyCode = 'USD') => {
  return currencyFormatter.format(amount, { code: currencyCode });
};

// Convert amount to Dinero object
export const amountToDinero = (amount: number | string, currencyCode = 'USD'): Dinero<number> => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const amountInCents = Math.round(numericAmount * 100);
  
  return dinero({ amount: amountInCents, currency: USD });
};

// Convert Dinero object to decimal string
export const dineroToDecimal = (amount: Dinero<number>): string => {
  return toDecimal(amount);
};

// Add two amounts
export const addAmounts = (amount1: number | string, amount2: number | string): string => {
  const dinero1 = amountToDinero(amount1);
  const dinero2 = amountToDinero(amount2);
  const result = add(dinero1, dinero2);
  
  return dineroToDecimal(result);
};

// Subtract amount2 from amount1
export const subtractAmounts = (amount1: number | string, amount2: number | string): string => {
  const dinero1 = amountToDinero(amount1);
  const dinero2 = amountToDinero(amount2);
  const result = subtract(dinero1, dinero2);
  
  return dineroToDecimal(result);
};

// Multiply amount by a factor
export const multiplyAmount = (amount: number | string, factor: number): string => {
  const dineroAmount = amountToDinero(amount);
  const result = multiply(dineroAmount, { amount: Math.round(factor * 100), scale: 2 });
  
  return dineroToDecimal(result);
};

// Hard-coded exchange rates for demo purposes
// In a real application, these would be fetched from an API
const exchangeRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.51,
  JPY: 151.89,
  CNY: 7.21,
  INR: 83.56,
  BRL: 5.10,
  CHF: 0.91,
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number | string,
  fromCurrency = 'USD',
  toCurrency = 'USD'
): string => {
  if (fromCurrency === toCurrency) return amount.toString();
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Convert to USD first (base currency)
  const amountInUSD = numericAmount / exchangeRates[fromCurrency];
  
  // Then convert to target currency
  const amountInTargetCurrency = amountInUSD * exchangeRates[toCurrency];
  
  return amountInTargetCurrency.toFixed(2);
};

// Calculate tax based on amount and tax rate
export const calculateTax = (amount: number | string, taxRate: number): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const taxAmount = numericAmount * (taxRate / 100);
  
  return taxAmount.toFixed(2);
};

// Calculate total with tax
export const calculateTotalWithTax = (amount: number | string, taxRate: number): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const tax = numericAmount * (taxRate / 100);
  const total = numericAmount + tax;
  
  return total.toFixed(2);
};