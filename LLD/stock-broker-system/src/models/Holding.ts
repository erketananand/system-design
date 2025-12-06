import { IdGenerator } from '../utils/IdGenerator';

export class Holding {
  public readonly id: string;
  public readonly userId: string;
  public readonly stockSymbol: string;
  public quantity: number;
  public averageBuyPrice: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    userId: string,
    stockSymbol: string,
    quantity: number,
    averageBuyPrice: number,
    id?: string
  ) {
    this.id = id || IdGenerator.generateId('HOLD');
    this.userId = userId;
    this.stockSymbol = stockSymbol.toUpperCase();
    this.quantity = quantity;
    this.averageBuyPrice = averageBuyPrice;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add quantity with new purchase
   */
  public addQuantity(quantity: number, price: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (price <= 0) {
      throw new Error('Price must be positive');
    }

    // Calculate new average price
    const totalCost = (this.quantity * this.averageBuyPrice) + (quantity * price);
    this.quantity += quantity;
    this.averageBuyPrice = totalCost / this.quantity;
    this.updatedAt = new Date();
  }

  /**
   * Reduce quantity on sale
   */
  public reduceQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (quantity > this.quantity) {
      throw new Error('Cannot reduce more than available quantity');
    }
    this.quantity -= quantity;
    this.updatedAt = new Date();
  }

  /**
   * Get current value of holding
   */
  public getCurrentValue(currentPrice: number): number {
    return this.quantity * currentPrice;
  }

  /**
   * Get invested amount
   */
  public getInvestedAmount(): number {
    return this.quantity * this.averageBuyPrice;
  }

  /**
   * Get unrealized P&L
   */
  public getUnrealizedPnL(currentPrice: number): number {
    return this.getCurrentValue(currentPrice) - this.getInvestedAmount();
  }

  /**
   * Get unrealized P&L percentage
   */
  public getUnrealizedPnLPercentage(currentPrice: number): number {
    const invested = this.getInvestedAmount();
    if (invested === 0) return 0;
    return (this.getUnrealizedPnL(currentPrice) / invested) * 100;
  }

  /**
   * Check if holding has quantity
   */
  public hasQuantity(): boolean {
    return this.quantity > 0;
  }
}
