import TelegramBot from 'node-telegram-bot-api';
import { TokenPair, Logger } from './types';

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;
  private logger: Logger;
  private minLiquidityUsd: number;

  constructor(botToken: string, chatId: string, logger: Logger, minLiquidityUsd: number = 500) {
    this.bot = new TelegramBot(botToken, { polling: false });
    this.chatId = chatId;
    this.logger = logger;
    this.minLiquidityUsd = minLiquidityUsd;
  }

  /**
   * Format and send token information to Telegram
   */
  async sendTokenAlert(pair: TokenPair): Promise<boolean> {
    try {
      const message = this.formatTokenMessage(pair);
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      });

      this.logger.info(`✅ Sent alert for token: ${pair.baseToken.symbol}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram message:`, error);
      return false;
    }
  }

  /**
   * Format token information into a readable message
   */
  private formatTokenMessage(pair: TokenPair): string {
    const lines: string[] = [
      '🚀 <b>New Solana Token Detected!</b>',
      '',
      `<b>💎 Token:</b> ${this.escapeHtml(pair.baseToken.name)} (${this.escapeHtml(pair.baseToken.symbol)})`,
      `<b>📝 Contract:</b> <code>${pair.baseToken.address}</code>`,
      '',
    ];

    // Add relative time if available
    if (pair.pairCreatedAt) {
      const relativeTime = this.formatRelativeTime(pair.pairCreatedAt);
      lines.push(`<b>🕐 Launched:</b> ${relativeTime}`);
    }

    // Add price information if available
    if (pair.priceUsd) {
      const price = parseFloat(pair.priceUsd);
      lines.push(`<b>💵 Price:</b> $${this.formatPrice(price)}`);
    }

    // Add liquidity information with warning for low liquidity
    if (pair.liquidity?.usd) {
      const liquidityUsd = pair.liquidity.usd;
      const liquidityWarning = liquidityUsd < this.minLiquidityUsd * 2 ? ' ⚠️' : '';
      lines.push(`<b>💧 Liquidity:</b> $${this.formatNumber(liquidityUsd)}${liquidityWarning}`);
      
      if (liquidityUsd < this.minLiquidityUsd * 2) {
        lines.push(`<i>⚠️ Low liquidity - Trade with caution!</i>`);
      }
    }

    // Add FDV/Market Cap if available
    if (pair.fdv) {
      lines.push(`<b>📊 Market Cap:</b> $${this.formatNumber(pair.fdv)}`);
    }

    lines.push('');
    lines.push(`<b>🔗 Links:</b>`);
    lines.push(`• <a href="${pair.url}">DexScreener Chart</a>`);
    lines.push(`• <a href="https://solscan.io/token/${pair.baseToken.address}">Solscan Explorer</a>`);
    lines.push(`• <a href="https://dexscreener.com/solana/${pair.pairAddress}">Trading Pair</a>`);

    return lines.join('\n');
  }

  /**
   * Format relative time (e.g., "5 minutes ago", "2 hours ago")
   */
  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const createdAtMs = timestamp * 1000;
    const diffMs = now - createdAtMs;

    // Convert to appropriate unit
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Format price with appropriate decimals
   */
  private formatPrice(price: number): string {
    if (price < 0.000001) {
      return price.toExponential(4);
    } else if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else {
      return price.toFixed(4);
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Format numbers with appropriate decimals and K/M/B suffixes
   */
  private formatNumber(num: number): string {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }

  /**
   * Test the bot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const me = await this.bot.getMe();
      this.logger.info(`✅ Connected to Telegram as @${me.username}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to Telegram:', error);
      return false;
    }
  }
}
