import { IdGenerator } from '../utils/IdGenerator';
import { Holding } from './Holding';

export class Portfolio {
  public readonly id: string;
  public readonly userId: string;
  public holdings: Map<string, Holding>;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(userId: string, id?: string) {
    this.id = id || IdGenerator.generateId('PORT');
    this.userId = userId;
    this.holdings = new Map();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add or update holding
   */
  public addOrUpdateHolding(stockSymbol: string, quantity: number, price: number): void {
    const upperSymbol = stockSymbol.toUpperCase();
    const existingHolding = this.holdings.get(upperSymbol);

    if (existingHolding) {
      existingHolding.addQuantity(quantity, price);
    } else {
      const newHolding = new Holding(this.userId, upperSymbol, quantity, price);
      this.holdings.set(upperSymbol, newHolding);
    }
    this.updatedAt = new Date();
  }

  /**
   * Reduce holding quantity
   */
  public reduceHolding(stockSymbol: string, quantity: number): void {
    const upperSymbol = stockSymbol.toUpperCase();
    const holding = this.holdings.get(upperSymbol);

    if (!holding) {
      throw new Error(`No holding found for ${upperSymbol}`);
    }

    holding.reduceQuantity(quantity);

    // Remove holding if quantity becomes zero
    if (!holding.hasQuantity()) {
      this.holdings.delete(upperSymbol);
    }

    this.updatedAt = new Date();
  }

  /**
   * Get holding for a stock
   */
  public getHolding(stockSymbol: string): Holding | undefined {
    return this.holdings.get(stockSymbol.toUpperCase());
  }

  /**
   * Check if user has holding for a stock
   */
  public hasHolding(stockSymbol: string): boolean {
    return this.holdings.has(stockSymbol.toUpperCase());
  }

  /**
   * Get total current value of portfolio
   */
  public getTotalCurrentValue(priceProvider: (symbol: string) => number): number {
    let totalValue = 0;
    for (const holding of this.holdings.values()) {
      const currentPrice = priceProvider(holding.stockSymbol);
      totalValue += holding.getCurrentValue(currentPrice);
    }
    return totalValue;
  }

  /**
   * Get total invested amount
   */
  public getTotalInvestedAmount(): number {
    let totalInvested = 0;
    for (const holding of this.holdings.values()) {
      totalInvested += holding.getInvestedAmount();
    }
    return totalInvested;
  }

  /**
   * Get total unrealized P&L
   */
  public getUnrealizedPnL(priceProvider: (symbol: string) => number): number {
    let totalPnL = 0;
    for (const holding of this.holdings.values()) {
      const currentPrice = priceProvider(holding.stockSymbol);
      totalPnL += holding.getUnrealizedPnL(currentPrice);
    }
    return totalPnL;
  }

  /**
   * Get total unrealized P&L percentage
   */
  public getUnrealizedPnLPercentage(priceProvider: (symbol: string) => number): number {
    const invested = this.getTotalInvestedAmount();
    if (invested === 0) return 0;
    return (this.getUnrealizedPnL(priceProvider) / invested) * 100;
  }

  /**
   * Get all holdings as array
   */
  public getAllHoldings(): Holding[] {
    return Array.from(this.holdings.values());
  }

  /**
   * Get number of holdings
   */
  public getHoldingsCount(): number {
    return this.holdings.size;
  }
}
