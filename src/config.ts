import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
  checkInterval: number;
  maxTokenAgeHours: number;
  minLiquidityUsd: number;
  debugMode: boolean;
}

export function loadConfig(): Config {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const checkInterval = parseInt(process.env.CHECK_INTERVAL || '60', 10);
  const maxTokenAgeHours = parseInt(process.env.MAX_TOKEN_AGE_HOURS || '6', 10);
  const minLiquidityUsd = parseInt(process.env.MIN_LIQUIDITY_USD || '500', 10);
  const debugMode = process.env.DEBUG_MODE === 'true';

  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  if (!telegramChatId) {
    throw new Error('TELEGRAM_CHAT_ID environment variable is required');
  }

  return {
    telegramBotToken,
    telegramChatId,
    checkInterval,
    maxTokenAgeHours,
    minLiquidityUsd,
    debugMode
  };
}
