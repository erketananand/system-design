import { Watchlist } from '../models/Watchlist';
import { Stock } from '../models/Stock';
import { WatchlistRepository } from '../repositories/WatchlistRepository';
import { MarketDataService } from './MarketDataService';
import { Logger } from '../utils/Logger';

export interface WatchlistStockView {
  symbol: string;
  companyName: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercentage: number;
}

export class WatchlistService {
  private watchlistRepository: WatchlistRepository;
  private marketDataService: MarketDataService;

  constructor() {
    this.watchlistRepository = new WatchlistRepository();
    this.marketDataService = MarketDataService.getInstance();
  }

  /**
   * Create new watchlist
   */
  public createWatchlist(userId: string, name: string): Watchlist {
    if (this.watchlistRepository.existsByUserAndName(userId, name)) {
      throw new Error(`Watchlist '${name}' already exists`);
    }

    const watchlist = new Watchlist(userId, name);
    this.watchlistRepository.save(watchlist);
    Logger.success(`[WatchlistService] Created watchlist '${name}' for user ${userId}`);
    return watchlist;
  }

  /**
   * Add stock to watchlist
   */
  public addStockToWatchlist(watchlistId: string, symbol: string): void {
    const watchlist = this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    // Verify stock exists
    const stock = this.marketDataService.getStock(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    watchlist.addStock(symbol);
    this.watchlistRepository.save(watchlist);
    Logger.info(`[WatchlistService] Added ${symbol} to watchlist ${watchlist.name}`);
  }

  /**
   * Remove stock from watchlist
   */
  public removeStockFromWatchlist(watchlistId: string, symbol: string): void {
    const watchlist = this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    watchlist.removeStock(symbol);
    this.watchlistRepository.save(watchlist);
    Logger.info(`[WatchlistService] Removed ${symbol} from watchlist ${watchlist.name}`);
  }

  /**
   * Get watchlists for user
   */
  public getWatchlistsForUser(userId: string): Watchlist[] {
    return this.watchlistRepository.findByUserId(userId);
  }

  /**
   * Get watchlist view with current prices
   */
  public getWatchlistView(watchlistId: string): WatchlistStockView[] {
    const watchlist = this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    const stockViews: WatchlistStockView[] = [];

    for (const symbol of watchlist.getStockSymbols()) {
      const stock = this.marketDataService.getStock(symbol);
      if (stock) {
        stockViews.push({
          symbol: stock.symbol,
          companyName: stock.companyName,
          currentPrice: stock.lastTradedPrice,
          dayChange: stock.getDayChange(),
          dayChangePercentage: stock.getDayChangePercentage()
        });
      }
    }

    return stockViews;
  }

  /**
   * Delete watchlist
   */
  public deleteWatchlist(watchlistId: string, userId: string): void {
    const watchlist = this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new Error('Unauthorized: Watchlist does not belong to user');
    }

    this.watchlistRepository.delete(watchlistId);
    Logger.info(`[WatchlistService] Deleted watchlist ${watchlist.name}`);
  }

  /**
   * Rename watchlist
   */
  public renameWatchlist(watchlistId: string, userId: string, newName: string): void {
    const watchlist = this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new Error('Unauthorized: Watchlist does not belong to user');
    }

    if (this.watchlistRepository.existsByUserAndName(userId, newName)) {
      throw new Error(`Watchlist '${newName}' already exists`);
    }

    watchlist.rename(newName);
    this.watchlistRepository.save(watchlist);
    Logger.info(`[WatchlistService] Renamed watchlist to '${newName}'`);
  }
}
