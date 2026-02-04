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
  private maxTokensPerBatch: number;
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
    this.maxTokensPerBatch = config.maxTokensPerBatch;

    logger.info(`Bot initialized with ${config.checkInterval}s check interval`);
    logger.info(`Max token age: ${config.maxTokenAgeSeconds}s, Max batch: ${config.maxTokensPerBatch}, Min liquidity: $${config.minLiquidityUsd}, Debug: ${config.debugMode}`);
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

    // Stop token tracker cleanup
    this.tokenTracker.stop();

    logger.info('✅ Bot stopped successfully');
  }

  /**
   * Check for new tokens and send alerts
   */
  private async checkForNewTokens(): Promise<void> {
    try {
      const timestamp = new Date().toLocaleTimeString();
      logger.info(`\n[${timestamp}] 🔍 Checking DexScreener...`);

      // Fetch new pairs from DexScreener (already filtered and limited to maxTokensPerBatch)
      const pairs = await this.dexScreener.fetchNewSolanaPairs(this.maxTokensPerBatch);

      if (pairs.length === 0) {
        logger.info(`[${timestamp}] No new tokens found within criteria`);
        logger.info(`[${timestamp}] Next check in ${this.checkInterval / 1000} seconds.\n`);
        return;
      }

      // Filter out already sent tokens
      const newPairs = pairs.filter(pair => !this.tokenTracker.hasSent(pair.baseToken.address));
      const alreadySentCount = pairs.length - newPairs.length;

      logger.info(`[${timestamp}] Already sent: ${alreadySentCount}, New: ${newPairs.length}`);

      if (newPairs.length === 0) {
        logger.info(`[${timestamp}] No new tokens to report`);
        logger.info(`[${timestamp}] Next check in ${this.checkInterval / 1000} seconds.\n`);
        return;
      }

      // Send batch of tokens
      logger.info(`[${timestamp}] ✅ Sending ${newPairs.length} token(s) to Telegram`);

      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < newPairs.length; i++) {
        const pair = newPairs[i];
        const tokenAddress = pair.baseToken.address;

        try {
          // Send alert to Telegram with index
          const sent = await this.telegram.sendTokenAlert(pair, i);

          if (sent) {
            // Mark as sent
            this.tokenTracker.markAsSent(tokenAddress);
            sentCount++;

            // Add delay between messages to avoid rate limiting (1-2 seconds)
            if (i < newPairs.length - 1) {
              await this.sleep(1500);
            }
          } else {
            failedCount++;
          }
        } catch (error) {
          logger.error(`  ❌ Error sending token ${i + 1}/${newPairs.length}:`, error);
          failedCount++;
          // Continue with next token even if this one fails
        }
      }

      logger.info(`[${timestamp}] 📊 Batch complete: ${sentCount} sent, ${failedCount} failed`);
      logger.info(`[${timestamp}] Total tokens tracked: ${this.tokenTracker.getSentCount()}`);
      logger.info(`[${timestamp}] Next check in ${this.checkInterval / 1000} seconds.\n`);
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
