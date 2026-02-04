import { loadConfig } from './config';
import { logger } from './logger';
import { DexScreenerService } from './dexscreener.service';
import { TelegramService } from './telegram.service';
import { TokenTracker } from './token-tracker';
import { TokenPair } from './types';

class SolanaTokenBot {
  private dexScreener: DexScreenerService;
  private telegram: TelegramService;
  private tokenTracker: TokenTracker;
  private checkInterval: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    // Load configuration
    const config = loadConfig();
    
    // Initialize services
    this.dexScreener = new DexScreenerService(
      logger, 
      config.maxTokenAgeSeconds, 
      config.minLiquidityUsd, 
      config.debugMode
    );
    this.telegram = new TelegramService(
      config.telegramBotToken,
      config.telegramChatId,
      logger
    );
    this.tokenTracker = new TokenTracker(logger);
    this.checkInterval = config.checkInterval * 1000; // Convert to milliseconds

    logger.info(`Bot initialized with ${config.checkInterval}s check interval`);
    logger.info(`Max token age: ${config.maxTokenAgeSeconds}s, Min liquidity: $${config.minLiquidityUsd}, Debug mode: ${config.debugMode}`);
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    logger.info('🚀 Starting Solana DexScreener Token Bot...');

    // Test Telegram connection
    const connected = await this.telegram.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Telegram. Please check your bot token and try again.');
    }

    this.isRunning = true;

    // Run first check immediately
    await this.checkForNewTokens();

    // Schedule periodic checks
    this.intervalId = setInterval(async () => {
      await this.checkForNewTokens();
    }, this.checkInterval);

    logger.info(`✅ Bot started successfully. Checking every ${this.checkInterval / 1000}s`);
  }

  /**
   * Stop the bot
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping bot...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('✅ Bot stopped successfully');
  }

  /**
   * Check for new tokens and send alerts
   */
  private async checkForNewTokens(): Promise<void> {
    try {
      logger.info('🔍 Checking for new tokens...');

      // Fetch new pairs from DexScreener
      const pairs = await this.dexScreener.fetchNewSolanaPairs();

      if (pairs.length === 0) {
        logger.info('No new tokens found');
        return;
      }

      // Process each pair
      let newTokensFound = 0;
      let alreadySentCount = 0;
      for (const pair of pairs) {
        const tokenAddress = pair.baseToken.address;

        // Check if we've already sent this token
        if (this.tokenTracker.hasSent(tokenAddress)) {
          alreadySentCount++;
          continue;
        }

        // Send alert to Telegram
        const sent = await this.telegram.sendTokenAlert(pair);

        if (sent) {
          // Mark as sent
          this.tokenTracker.markAsSent(tokenAddress);
          newTokensFound++;

          // Add a small delay between messages to avoid rate limiting
          await this.sleep(1000);
        }
      }

      if (newTokensFound > 0) {
        logger.info(`[INFO] Sent ${newTokensFound} new token${newTokensFound !== 1 ? 's' : ''}, filtered ${alreadySentCount} (already sent)`);
      } else {
        logger.info('No new tokens to report');
      }

      logger.info(`Total tokens tracked: ${this.tokenTracker.getSentCount()}`);
    } catch (error) {
      logger.error('Error checking for new tokens:', error);
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const bot = new SolanaTokenBot();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\n📛 Received SIGINT signal');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('\n📛 Received SIGTERM signal');
    bot.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    bot.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  });

  // Start the bot
  try {
    await bot.start();
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Run the bot
main();
