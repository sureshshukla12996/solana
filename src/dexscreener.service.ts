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
      const currentTime = new Date().toISOString().replace('T', ' ').split('.')[0];
      this.logger.info(`[INFO] Checking DexScreener at ${currentTime}`);
      
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
      
      // Process only top 10 newest tokens to save processing time
      const topNewest = solanaPairs.slice(0, 10);
      this.logger.info(`[INFO] Fetched ${totalPairs} pairs, processing top ${topNewest.length} newest`);

      // Get pairs created within MAX_TOKEN_AGE_SECONDS (ultra-strict time filtering)
      const maxAgeMs = this.maxTokenAgeSeconds * 1000;
      const cutoffTime = Date.now() - maxAgeMs;
      let tooOldCount = 0;
      
      const recentPairs = topNewest.filter(pair => {
        const tokenCreatedAt = (pair.pairCreatedAt || 0) * 1000;
        const tokenAgeSeconds = Math.floor((Date.now() - tokenCreatedAt) / 1000);
        const isRecent = tokenCreatedAt >= cutoffTime;
        
        if (this.debugMode) {
          if (isRecent) {
            this.logger.info(`[INFO] Token ${pair.baseToken.symbol}: ${tokenAgeSeconds} seconds old ✅ PASS`);
          } else {
            this.logger.info(`[INFO] Token ${pair.baseToken.symbol}: ${tokenAgeSeconds} seconds old ❌ TOO OLD (>${this.maxTokenAgeSeconds}s)`);
            tooOldCount++;
          }
        } else {
          if (!isRecent) {
            tooOldCount++;
          }
        }
        
        return isRecent;
      });

      // Filter by minimum liquidity
      const liquidPairs = recentPairs.filter(pair => {
        const hasLiquidity = pair.liquidity?.usd !== undefined && pair.liquidity.usd >= this.minLiquidityUsd;
        
        if (this.debugMode && !hasLiquidity) {
          this.logger.info(`[INFO] Token ${pair.baseToken.symbol}: filtered out due to low liquidity ($${pair.liquidity?.usd?.toFixed(2) || 0})`);
        }
        
        return hasLiquidity;
      });

      this.logger.info(`[INFO] Found ${liquidPairs.length} tokens within ${this.maxTokenAgeSeconds}s, filtered ${tooOldCount} (too old)`);
      
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
