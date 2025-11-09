declare module 'currency-formatter' {
  export function format(amount: number, options: { code: string }): string;
  export function unformat(value: string, options: { code: string }): number;
} 