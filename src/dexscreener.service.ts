import axios, { AxiosInstance } from 'axios';
import { DexScreenerResponse, TokenPair, Logger } from './types';

export class DexScreenerService {
  private readonly api: AxiosInstance;
  private readonly logger: Logger;
  private readonly baseUrl = 'https://api.dexscreener.com/latest/dex';
  private readonly maxTokenAgeSeconds: number;
  private readonly minLiquidityUsd: number;
  private readonly debugMode: boolean;

  constructor(logger: Logger, maxTokenAgeSeconds: number, minLiquidityUsd: number, debugMode: boolean) {
    this.logger = logger;
    this.maxTokenAgeSeconds = maxTokenAgeSeconds;
    this.minLiquidityUsd = minLiquidityUsd;
    this.debugMode = debugMode;
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

      const totalPairs = solanaPairs.length;

      // Get pairs created within MAX_TOKEN_AGE_SECONDS (ultra-strict time filtering)
      const maxAgeMs = this.maxTokenAgeSeconds * 1000;
      const cutoffTime = Date.now() - maxAgeMs;
      const recentPairs = solanaPairs.filter(pair => {
        const tokenCreatedAt = (pair.pairCreatedAt || 0) * 1000;
        const tokenAgeSeconds = (Date.now() - tokenCreatedAt) / 1000;
        
        if (this.debugMode) {
          this.logger.info(`Token ${pair.baseToken.symbol}: created ${tokenAgeSeconds.toFixed(0)}s ago`);
        }
        
        return tokenCreatedAt >= cutoffTime;
      });

      // Filter by minimum liquidity
      const liquidPairs = recentPairs.filter(pair => {
        const hasLiquidity = pair.liquidity?.usd !== undefined && pair.liquidity.usd >= this.minLiquidityUsd;
        
        if (this.debugMode && !hasLiquidity) {
          this.logger.info(`Token ${pair.baseToken.symbol}: filtered out due to low liquidity ($${pair.liquidity?.usd || 0})`);
        }
        
        return hasLiquidity;
      });

      this.logger.info(`Found ${totalPairs} tokens, ${recentPairs.length} are within last ${this.maxTokenAgeSeconds} seconds, ${liquidPairs.length} meet liquidity requirement ($${this.minLiquidityUsd}+)`);
      
      return liquidPairs;
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
