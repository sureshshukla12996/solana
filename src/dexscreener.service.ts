import axios, { AxiosInstance } from 'axios';
import { DexScreenerResponse, TokenPair, Logger } from './types';

export class DexScreenerService {
  private readonly api: AxiosInstance;
  private readonly logger: Logger;
  private readonly baseUrl = 'https://api.dexscreener.com/latest/dex';
  private maxTokenAgeHours: number;
  private minLiquidityUsd: number;
  private debugMode: boolean;

  constructor(logger: Logger, maxTokenAgeHours: number = 6, minLiquidityUsd: number = 500, debugMode: boolean = false) {
    this.logger = logger;
    this.maxTokenAgeHours = maxTokenAgeHours;
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

      const totalFetched = response.data.pairs.length;
      this.logger.info(`Fetched ${totalFetched} total pairs from DexScreener`);

      // Filter for Solana pairs only
      const solanaPairs = response.data.pairs.filter(pair => pair.chainId === 'solana');
      
      if (this.debugMode) {
        this.logger.info(`After Solana filter: ${solanaPairs.length} pairs`);
      }

      // Apply all filters
      const filteredPairs = this.applyFilters(solanaPairs);

      // Sort by creation time (newest first)
      filteredPairs.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));

      this.logger.info(`After filtering: ${filteredPairs.length} new token pairs match criteria`);
      return filteredPairs;
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
   * Apply all filters to token pairs
   */
  private applyFilters(pairs: TokenPair[]): TokenPair[] {
    const now = Date.now();
    const maxAgeMs = this.maxTokenAgeHours * 60 * 60 * 1000;
    const cutoffTime = now - maxAgeMs;

    let filteredByCreationTime = 0;
    let filteredByLiquidity = 0;
    let filteredByInvalidDate = 0;
    let filteredByFutureDate = 0;

    const filtered = pairs.filter(pair => {
      // Filter 1: Must have creation timestamp
      if (!pair.pairCreatedAt) {
        filteredByInvalidDate++;
        if (this.debugMode) {
          this.logger.info(`Filtered (no timestamp): ${pair.baseToken.symbol}`);
        }
        return false;
      }

      // Convert Unix timestamp (seconds) to milliseconds
      const createdAtMs = pair.pairCreatedAt * 1000;

      // Filter 2: Validate date is not in the future
      if (createdAtMs > now) {
        filteredByFutureDate++;
        if (this.debugMode) {
          this.logger.info(`Filtered (future date): ${pair.baseToken.symbol} - ${new Date(createdAtMs).toISOString()}`);
        }
        return false;
      }

      // Filter 3: Check if token is within the allowed age window
      if (createdAtMs < cutoffTime) {
        filteredByCreationTime++;
        if (this.debugMode) {
          const ageHours = ((now - createdAtMs) / (60 * 60 * 1000)).toFixed(2);
          this.logger.info(`Filtered (too old): ${pair.baseToken.symbol} - Age: ${ageHours}h`);
        }
        return false;
      }

      // Filter 4: Check minimum liquidity
      const liquidityUsd = pair.liquidity?.usd || 0;
      if (liquidityUsd < this.minLiquidityUsd) {
        filteredByLiquidity++;
        if (this.debugMode) {
          this.logger.info(`Filtered (low liquidity): ${pair.baseToken.symbol} - Liquidity: $${liquidityUsd.toFixed(2)}`);
        }
        return false;
      }

      // Token passed all filters
      if (this.debugMode) {
        const ageMinutes = ((now - createdAtMs) / (60 * 1000)).toFixed(0);
        this.logger.info(`✓ Accepted: ${pair.baseToken.symbol} - Age: ${ageMinutes}m, Liquidity: $${liquidityUsd.toFixed(2)}`);
      }

      return true;
    });

    // Log filtering statistics
    this.logger.info(`Filtering stats: ${filteredByInvalidDate} no timestamp, ${filteredByFutureDate} future dates, ${filteredByCreationTime} too old (>${this.maxTokenAgeHours}h), ${filteredByLiquidity} low liquidity (<$${this.minLiquidityUsd})`);

    return filtered;
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
