import { IdGenerator } from '../utils/IdGenerator';
import { OrderSide } from '../enums/OrderSide';

export class Trade {
  public readonly id: string;
  public readonly userId: string;
  public readonly orderId: string;
  public readonly stockSymbol: string;
  public readonly side: OrderSide;
  public readonly quantity: number;
  public readonly price: number;
  public readonly executedAt: Date;
  public readonly brokerage: number;
  public readonly taxes: number;
  public readonly totalCharges: number;

  constructor(
    userId: string,
    orderId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    price: number,
    brokerage: number,
    taxes: number,
    id?: string
  ) {
    this.id = id || IdGenerator.generateTradeId();
    this.userId = userId;
    this.orderId = orderId;
    this.stockSymbol = stockSymbol.toUpperCase();
    this.side = side;
    this.quantity = quantity;
    this.price = price;
    this.brokerage = brokerage;
    this.taxes = taxes;
    this.totalCharges = brokerage + taxes;
    this.executedAt = new Date();
  }

  /**
   * Get trade value (quantity * price)
   */
  public getTradeValue(): number {
    return this.quantity * this.price;
  }

  /**
   * Get net amount (trade value + charges for buy, trade value - charges for sell)
   */
  public getNetAmount(): number {
    const tradeValue = this.getTradeValue();
    if (this.side === OrderSide.BUY) {
      return tradeValue + this.totalCharges;
    } else {
      return tradeValue - this.totalCharges;
    }
  }

  /**
   * Get realized P&L for this trade (only for sell trades)
   */
  public getRealizedPnL(buyAveragePrice: number): number | null {
    if (this.side !== OrderSide.SELL) {
      return null;
    }
    const sellValue = this.getTradeValue();
    const buyValue = this.quantity * buyAveragePrice;
    return sellValue - buyValue - this.totalCharges;
  }

  /**
   * Get trade display string
   */
  public getDisplayString(): string {
    return `${this.side} ${this.quantity} ${this.stockSymbol} @ ₹${this.price.toFixed(2)} | Charges: ₹${this.totalCharges.toFixed(2)}`;
  }

  /**
   * Get detailed trade info
   */
  public getDetailedInfo(): string {
    return `
Trade ID: ${this.id}
Order ID: ${this.orderId}
${this.side} ${this.quantity} ${this.stockSymbol}
Price: ₹${this.price.toFixed(2)}
Trade Value: ₹${this.getTradeValue().toFixed(2)}
Brokerage: ₹${this.brokerage.toFixed(2)}
Taxes: ₹${this.taxes.toFixed(2)}
Total Charges: ₹${this.totalCharges.toFixed(2)}
Net Amount: ₹${this.getNetAmount().toFixed(2)}
Executed At: ${this.executedAt.toLocaleString()}
    `.trim();
  }
}
