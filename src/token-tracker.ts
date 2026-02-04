import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './types';

interface TrackedToken {
  address: string;
  timestamp: number;
}

/**
 * Simple file-based storage for tracking sent token addresses
 * Stores tokens with timestamps and clears entries older than 24 hours
 */
export class TokenTracker {
  private sentTokens: Map<string, number>; // address -> timestamp
  private readonly filePath: string;
  private readonly logger: Logger;
  private readonly maxAgeMs: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(logger: Logger, filePath: string = 'sent-tokens.json') {
    this.logger = logger;
    this.filePath = path.resolve(process.cwd(), filePath);
    this.sentTokens = new Map();
    this.loadFromFile();
    this.cleanOldEntries();
  }

  /**
   * Check if a token has already been sent
   */
  hasSent(tokenAddress: string): boolean {
    return this.sentTokens.has(tokenAddress);
  }

  /**
   * Mark a token as sent with current timestamp
   */
  markAsSent(tokenAddress: string): void {
    this.sentTokens.set(tokenAddress, Date.now());
    this.saveToFile();
  }

  /**
   * Get the count of sent tokens
   */
  getSentCount(): number {
    return this.sentTokens.size;
  }

  /**
   * Clean entries older than 24 hours
   */
  private cleanOldEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [address, timestamp] of this.sentTokens.entries()) {
      if (now - timestamp > this.maxAgeMs) {
        this.sentTokens.delete(address);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.info(`Cleaned ${removedCount} old token entries (>24h)`);
      this.saveToFile();
    }
  }

  /**
   * Load sent tokens from file
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Handle legacy format (array of strings) and migrate to new format
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            // Legacy format: array of strings
            this.logger.info('Migrating from legacy token storage format...');
            const now = Date.now();
            this.sentTokens = new Map(
              parsed.map((address: string) => [address, now])
            );
            this.saveToFile(); // Save in new format
            this.logger.info(`Migrated ${this.sentTokens.size} tokens to new format`);
          } else {
            // New format: array of TrackedToken objects
            this.sentTokens = new Map(
              (parsed as TrackedToken[]).map(t => [t.address, t.timestamp])
            );
          }
        }
        
        this.logger.info(`Loaded ${this.sentTokens.size} previously sent tokens`);
      } else {
        this.logger.info('No previous token history found, starting fresh');
      }
    } catch (error) {
      this.logger.error('Error loading sent tokens from file:', error);
      this.sentTokens = new Map();
    }
  }

  /**
   * Save sent tokens to file
   */
  private saveToFile(): void {
    try {
      const tokens: TrackedToken[] = Array.from(this.sentTokens.entries()).map(
        ([address, timestamp]) => ({ address, timestamp })
      );
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
