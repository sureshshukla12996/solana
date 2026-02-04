import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
  checkInterval: number;
}

export function loadConfig(): Config {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const checkInterval = parseInt(process.env.CHECK_INTERVAL || '60', 10);

  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  if (!telegramChatId) {
    throw new Error('TELEGRAM_CHAT_ID environment variable is required');
  }

  return {
    telegramBotToken,
    telegramChatId,
    checkInterval
  };
}
