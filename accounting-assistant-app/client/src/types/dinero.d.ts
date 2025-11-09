declare module 'dinero.js' {
  export interface Dinero<T> {
    amount: number;
    currency: any;
  }

  export function dinero<T>(options: { amount: number; currency: any }): Dinero<T>;
  export function toDecimal(dinero: Dinero<any>): string;
  export function add(dinero1: Dinero<any>, dinero2: Dinero<any>): Dinero<any>;
  export function subtract(dinero1: Dinero<any>, dinero2: Dinero<any>): Dinero<any>;
  export function multiply(dinero: Dinero<any>, multiplier: { amount: number; scale: number }): Dinero<any>;
} 