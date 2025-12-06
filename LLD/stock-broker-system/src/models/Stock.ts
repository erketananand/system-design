import { Sector } from '../enums/Sector';

export class Stock {
  public readonly symbol: string;
  public companyName: string;
  public sector: Sector;
  public lastTradedPrice: number;
  public dayOpenPrice: number;
  public dayHighPrice: number;
  public dayLowPrice: number;
  public previousClosePrice: number;
  public dayVolume: number;
  public lastUpdatedAt: Date;

  constructor(
    symbol: string,
    companyName: string,
    sector: Sector,
    lastTradedPrice: number
  ) {
    this.symbol = symbol.toUpperCase();
    this.companyName = companyName;
    this.sector = sector;
    this.lastTradedPrice = lastTradedPrice;
    this.dayOpenPrice = lastTradedPrice;
    this.dayHighPrice = lastTradedPrice;
    this.dayLowPrice = lastTradedPrice;
    this.previousClosePrice = lastTradedPrice;
    this.dayVolume = 0;
    this.lastUpdatedAt = new Date();
  }

  /**
   * Update stock price with new trade
   */
  public updatePrice(newPrice: number, volume: number): void {
    if (newPrice <= 0) {
      throw new Error('Price must be positive');
    }
    this.lastTradedPrice = newPrice;
    this.dayVolume += volume;

    // Update high/low
    if (newPrice > this.dayHighPrice) {
      this.dayHighPrice = newPrice;
    }
    if (newPrice < this.dayLowPrice) {
      this.dayLowPrice = newPrice;
    }

    this.lastUpdatedAt = new Date();
  }

  /**
   * Get day's price change in absolute value
   */
  public getDayChange(): number {
    return this.lastTradedPrice - this.previousClosePrice;
  }

  /**
   * Get day's price change in percentage
   */
  public getDayChangePercentage(): number {
    if (this.previousClosePrice === 0) return 0;
    return ((this.lastTradedPrice - this.previousClosePrice) / this.previousClosePrice) * 100;
  }

  /**
   * Reset for new trading day
   */
  public resetDay(openPrice: number): void {
    this.previousClosePrice = this.lastTradedPrice;
    this.dayOpenPrice = openPrice;
    this.lastTradedPrice = openPrice;
    this.dayHighPrice = openPrice;
    this.dayLowPrice = openPrice;
    this.dayVolume = 0;
    this.lastUpdatedAt = new Date();
  }

  /**
   * Get stock display string
   */
  public getDisplayString(): string {
    const change = this.getDayChange();
    const changePct = this.getDayChangePercentage();
    const sign = change >= 0 ? '+' : '';
    return `${this.symbol} (${this.companyName}) - ₹${this.lastTradedPrice.toFixed(2)} ${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
  }
}
