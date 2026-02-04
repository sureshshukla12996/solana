import { Logger } from './types';

class ConsoleLogger implements Logger {
  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${this.formatTimestamp()}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.formatTimestamp()}] [ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.formatTimestamp()}] [WARN] ${message}`, ...args);
  }
}

export const logger = new ConsoleLogger();
