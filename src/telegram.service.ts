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
  async sendTokenAlert(pair: TokenPair, index?: number): Promise<boolean> {
    try {
      const message = this.formatTokenMessage(pair, index);
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      });

      const tokenAge = pair.pairCreatedAt 
        ? Math.floor((Date.now() - pair.pairCreatedAt * 1000) / 1000)
        : 'unknown';
      this.logger.info(`  ✅ Token ${index !== undefined ? index + 1 : ''}: ${pair.baseToken.symbol} (${tokenAge}s old) - SENT`);
      return true;
    } catch (error) {
      this.logger.error(`  ❌ Failed to send alert for ${pair.baseToken.symbol}:`, error);
      return false;
    }
  }

  /**
   * Format token information into a readable message
   */
  private formatTokenMessage(pair: TokenPair, index?: number): string {
    const lines: string[] = [];
    
    // Add header with index if provided
    if (index !== undefined) {
      lines.push(`🚀 <b>NEW TOKEN #${index + 1}</b>`);
    } else {
      lines.push('🚀 <b>NEW TOKEN</b>');
    }
    
    lines.push('');
    lines.push(`<b>Token:</b> ${this.escapeHtml(pair.baseToken.name)} (${this.escapeHtml(pair.baseToken.symbol)})`);
    
    // Shorten contract address for better readability
    const shortAddress = this.shortenAddress(pair.baseToken.address);
    lines.push(`<b>Contract:</b> <code>${shortAddress}</code>`);
    lines.push('');

    // Add launch time - ALWAYS in seconds
    if (pair.pairCreatedAt) {
      const tokenCreatedAt = pair.pairCreatedAt * 1000;
      const ageSeconds = Math.floor((Date.now() - tokenCreatedAt) / 1000);
      lines.push(`⚡ <b>Launched ${ageSeconds} second${ageSeconds !== 1 ? 's' : ''} ago</b>`);
    }

    // Add price and liquidity in a compact format
    const priceStr = pair.priceUsd ? `$${this.formatNumber(parseFloat(pair.priceUsd))}` : 'N/A';
    const liqStr = pair.liquidity?.usd ? `$${this.formatNumber(pair.liquidity.usd)}` : 'N/A';
    lines.push(`💰 ${priceStr} | 💧 ${liqStr}`);

    // Add chain and DEX info
    lines.push(`⛓️ Solana | ${this.capitalizeFirst(pair.dexId)}`);

    lines.push('');
    lines.push(`🔗 <a href="${pair.url}">DexScreener</a> | <a href="https://solscan.io/token/${pair.baseToken.address}">Solscan</a>`);

    return lines.join('\n');
  }

  /**
   * Shorten address for display (e.g., 7xK...abc)
   */
  private shortenAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.substring(0, 3)}...${address.substring(address.length - 3)}`;
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
