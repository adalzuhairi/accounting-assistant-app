declare module 'papaparse' {
  interface ParseResult<T> {
    data: T[];
    errors: any[];
    meta: any;
  }

  interface ParseConfig {
    header?: boolean;
    complete?: (results: ParseResult<any>) => void;
    error?: (error: any) => void;
  }

  export function parse(file: File, config: ParseConfig): void;
  export function unparse(data: any[][]): string;
} 