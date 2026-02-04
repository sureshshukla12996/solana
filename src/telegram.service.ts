import TelegramBot from 'node-telegram-bot-api';
import { TokenPair, Logger } from './types';

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;
  private logger: Logger;

  constructor(botToken: string, chatId: string, logger: Logger) {
    this.bot = new TelegramBot(botToken, { polling: false });
    this.chatId = chatId;
    this.logger = logger;
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
      `<b>Token:</b> ${this.escapeHtml(pair.baseToken.name)} (${this.escapeHtml(pair.baseToken.symbol)})`,
      `<b>Contract:</b> <code>${pair.baseToken.address}</code>`,
      '',
      `<b>Chain:</b> Solana`,
      `<b>DEX:</b> ${this.capitalizeFirst(pair.dexId)}`,
    ];

    // Add price information if available
    if (pair.priceUsd) {
      lines.push(`<b>Price:</b> $${this.formatNumber(parseFloat(pair.priceUsd))}`);
    }

    // Add liquidity information if available
    if (pair.liquidity?.usd) {
      lines.push(`<b>Liquidity:</b> $${this.formatNumber(pair.liquidity.usd)}`);
    }

    // Add FDV if available
    if (pair.fdv) {
      lines.push(`<b>FDV:</b> $${this.formatNumber(pair.fdv)}`);
    }

    // Add creation time if available
    if (pair.pairCreatedAt) {
      const createdDate = new Date(pair.pairCreatedAt * 1000);
      lines.push(`<b>Created:</b> ${createdDate.toUTCString()}`);
    }

    lines.push('');
    lines.push(`<b>🔗 Links:</b>`);
    lines.push(`📊 <a href="${pair.url}">DexScreener</a>`);
    lines.push(`🔍 <a href="https://solscan.io/token/${pair.baseToken.address}">Solscan</a>`);

    return lines.join('\n');
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
    if (num < 0.01) {
      return num.toExponential(4);
    }
    return num.toFixed(4);
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
