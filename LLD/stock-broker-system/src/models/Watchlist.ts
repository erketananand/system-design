import { IdGenerator } from '../utils/IdGenerator';

export class Watchlist {
  public readonly id: string;
  public readonly userId: string;
  public name: string;
  public stockSymbols: Set<string>;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(userId: string, name: string, id?: string) {
    this.id = id || IdGenerator.generateWatchlistId();
    this.userId = userId;
    this.name = name;
    this.stockSymbols = new Set();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add stock to watchlist
   */
  public addStock(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    if (this.stockSymbols.has(upperSymbol)) {
      throw new Error(`${upperSymbol} is already in watchlist`);
    }
    this.stockSymbols.add(upperSymbol);
    this.updatedAt = new Date();
  }

  /**
   * Remove stock from watchlist
   */
  public removeStock(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    if (!this.stockSymbols.has(upperSymbol)) {
      throw new Error(`${upperSymbol} is not in watchlist`);
    }
    this.stockSymbols.delete(upperSymbol);
    this.updatedAt = new Date();
  }

  /**
   * Check if stock is in watchlist
   */
  public hasStock(symbol: string): boolean {
    return this.stockSymbols.has(symbol.toUpperCase());
  }

  /**
   * Get all stock symbols as array
   */
  public getStockSymbols(): string[] {
    return Array.from(this.stockSymbols);
  }

  /**
   * Get number of stocks in watchlist
   */
  public getStockCount(): number {
    return this.stockSymbols.size;
  }

  /**
   * Rename watchlist
   */
  public rename(newName: string): void {
    this.name = newName;
    this.updatedAt = new Date();
  }

  /**
   * Clear all stocks
   */
  public clear(): void {
    this.stockSymbols.clear();
    this.updatedAt = new Date();
  }
}
