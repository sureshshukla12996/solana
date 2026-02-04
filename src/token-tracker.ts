import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './types';

/**
 * Simple file-based storage for tracking sent token addresses
 */
export class TokenTracker {
  private sentTokens: Set<string>;
  private readonly filePath: string;
  private readonly logger: Logger;

  constructor(logger: Logger, filePath: string = 'sent-tokens.json') {
    this.logger = logger;
    this.filePath = path.resolve(process.cwd(), filePath);
    this.sentTokens = new Set();
    this.loadFromFile();
  }

  /**
   * Check if a token has already been sent
   */
  hasSent(tokenAddress: string): boolean {
    return this.sentTokens.has(tokenAddress);
  }

  /**
   * Mark a token as sent
   */
  markAsSent(tokenAddress: string): void {
    this.sentTokens.add(tokenAddress);
    this.saveToFile();
  }

  /**
   * Get the count of sent tokens
   */
  getSentCount(): number {
    return this.sentTokens.size;
  }

  /**
   * Load sent tokens from file
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const tokens = JSON.parse(data) as string[];
        this.sentTokens = new Set(tokens);
        this.logger.info(`Loaded ${this.sentTokens.size} previously sent tokens`);
      } else {
        this.logger.info('No previous token history found, starting fresh');
      }
    } catch (error) {
      this.logger.error('Error loading sent tokens from file:', error);
      this.sentTokens = new Set();
    }
  }

  /**
   * Save sent tokens to file
   */
  private saveToFile(): void {
    try {
      const tokens = Array.from(this.sentTokens);
      fs.writeFileSync(this.filePath, JSON.stringify(tokens, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Error saving sent tokens to file:', error);
    }
  }

  /**
   * Clear all sent tokens (useful for testing)
   */
  clear(): void {
    this.sentTokens.clear();
    this.saveToFile();
    this.logger.info('Cleared all sent tokens');
  }
}
