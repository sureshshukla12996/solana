import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './types';

interface TrackedToken {
  address: string;
  timestamp: number;
}

/**
 * Simple memory-based storage for tracking sent token addresses with timestamps
 * Automatically cleans up tokens older than 2 minutes
 */
export class TokenTracker {
  private sentTokens: Map<string, number>; // address -> timestamp
  private readonly logger: Logger;
  private readonly cleanupIntervalMs = 30000; // Clean up every 30 seconds
  private readonly maxAgeMs = 120000; // 2 minutes
  private cleanupTimer?: NodeJS.Timeout;

  constructor(logger: Logger) {
    this.logger = logger;
    this.sentTokens = new Map();
    
    // Start automatic cleanup
    this.startCleanup();
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
    this.sentTokens.set(tokenAddress, Date.now());
  }

  /**
   * Get the count of sent tokens
   */
  getSentCount(): number {
    return this.sentTokens.size;
  }

  /**
   * Start automatic cleanup of old tokens
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Clean up tokens older than 2 minutes
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.maxAgeMs;
    let removedCount = 0;

    for (const [address, timestamp] of this.sentTokens.entries()) {
      if (timestamp < cutoff) {
        this.sentTokens.delete(address);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.info(`🧹 Cleaned up ${removedCount} old token(s) from tracking. Current: ${this.sentTokens.size}`);
    }
  }

  /**
   * Stop the cleanup timer
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clear all sent tokens (useful for testing)
   */
  clear(): void {
    this.sentTokens.clear();
    this.logger.info('Cleared all sent tokens');
  }
}
