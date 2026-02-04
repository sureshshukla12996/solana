import axios, { AxiosInstance } from 'axios';
import { DexScreenerResponse, TokenPair, Logger } from './types';

export class DexScreenerService {
  private readonly api: AxiosInstance;
  private readonly logger: Logger;
  private readonly baseUrl = 'https://api.dexscreener.com/latest/dex';

  constructor(logger: Logger) {
    this.logger = logger;
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Fetch new token pairs from Solana chain
   * This fetches the latest pairs sorted by creation time
   */
  async fetchNewSolanaPairs(): Promise<TokenPair[]> {
    try {
      // DexScreener API endpoint for new pairs on Solana
      // We use the search endpoint to get recently added tokens
      const response = await this.api.get<DexScreenerResponse>(
        '/search/?q=solana'
      );

      if (!response.data || !response.data.pairs) {
        this.logger.warn('No pairs found in DexScreener response');
        return [];
      }

      // Filter for Solana pairs and sort by creation time
      const solanaPairs = response.data.pairs
        .filter(pair => pair.chainId === 'solana')
        .filter(pair => pair.pairCreatedAt) // Only pairs with creation timestamp
        .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0)); // Newest first

      // Get pairs created in the last 5 minutes to catch new launches
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const recentPairs = solanaPairs.filter(
        pair => (pair.pairCreatedAt || 0) * 1000 >= fiveMinutesAgo
      );

      this.logger.info(`Fetched ${recentPairs.length} recent Solana pairs`);
      return recentPairs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `DexScreener API error: ${error.response?.status} - ${error.message}`
        );
      } else {
        this.logger.error('Error fetching DexScreener data:', error);
      }
      return [];
    }
  }

  /**
   * Alternative method: Fetch latest boosted/promoted pairs
   * This can catch tokens that are being actively traded
   */
  async fetchLatestBoostedPairs(): Promise<TokenPair[]> {
    try {
      const response = await this.api.get<DexScreenerResponse>(
        '/tokens/solana'
      );

      if (!response.data || !response.data.pairs) {
        return [];
      }

      return response.data.pairs.filter(pair => pair.chainId === 'solana');
    } catch (error) {
      this.logger.error('Error fetching boosted pairs:', error);
      return [];
    }
  }
}
