import { Logger } from './types';

class ConsoleLogger implements Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${this.formatTimestamp()}] [INFO] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.formatTimestamp()}] [ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.formatTimestamp()}] [WARN] ${message}`, ...args);
  }
}

export const logger = new ConsoleLogger();
