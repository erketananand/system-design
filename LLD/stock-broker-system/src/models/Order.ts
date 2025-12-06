import { IdGenerator } from '../utils/IdGenerator';
import { OrderType } from '../enums/OrderType';
import { OrderSide } from '../enums/OrderSide';
import { OrderStatus } from '../enums/OrderStatus';
import { OrderValidity } from '../enums/OrderValidity';

export class Order {
  public readonly id: string;
  public readonly userId: string;
  public readonly stockSymbol: string;
  public readonly orderType: OrderType;
  public readonly side: OrderSide;
  public readonly quantity: number;
  public readonly price: number | null;
  public readonly triggerPrice: number | null;
  public status: OrderStatus;
  public readonly validity: OrderValidity;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public exchangeOrderId: string | null;
  public remarks: string | null;

  constructor(
    userId: string,
    stockSymbol: string,
    orderType: OrderType,
    side: OrderSide,
    quantity: number,
    price: number | null = null,
    triggerPrice: number | null = null,
    validity: OrderValidity = OrderValidity.DAY,
    id?: string
  ) {
    this.id = id || IdGenerator.generateOrderId();
    this.userId = userId;
    this.stockSymbol = stockSymbol.toUpperCase();
    this.orderType = orderType;
    this.side = side;
    this.quantity = quantity;
    this.price = price;
    this.triggerPrice = triggerPrice;
    this.status = OrderStatus.PENDING;
    this.validity = validity;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.exchangeOrderId = null;
    this.remarks = null;
  }

  /**
   * Mark order as sent to exchange
   */
  public markSentToExchange(exchangeOrderId: string): void {
    this.status = OrderStatus.SENT_TO_EXCHANGE;
    this.exchangeOrderId = exchangeOrderId;
    this.updatedAt = new Date();
  }

  /**
   * Mark order as executed
   */
  public markExecuted(): void {
    this.status = OrderStatus.EXECUTED;
    this.updatedAt = new Date();
  }

  /**
   * Mark order as cancelled
   */
  public markCancelled(remarks?: string): void {
    this.status = OrderStatus.CANCELLED;
    this.remarks = remarks || 'Cancelled by user';
    this.updatedAt = new Date();
  }

  /**
   * Mark order as rejected
   */
  public markRejected(remarks: string): void {
    this.status = OrderStatus.REJECTED;
    this.remarks = remarks;
    this.updatedAt = new Date();
  }

  /**
   * Mark order as partially executed
   */
  public markPartiallyExecuted(): void {
    this.status = OrderStatus.PARTIALLY_EXECUTED;
    this.updatedAt = new Date();
  }

  /**
   * Check if order is active (can be cancelled)
   */
  public isActive(): boolean {
    return this.status === OrderStatus.PENDING || 
           this.status === OrderStatus.SENT_TO_EXCHANGE ||
           this.status === OrderStatus.PARTIALLY_EXECUTED;
  }

  /**
   * Check if order is terminal (completed)
   */
  public isTerminal(): boolean {
    return this.status === OrderStatus.EXECUTED ||
           this.status === OrderStatus.CANCELLED ||
           this.status === OrderStatus.REJECTED;
  }

  /**
   * Get order value (quantity * price)
   */
  public getOrderValue(currentPrice?: number): number {
    let effectivePrice: number;

    if (this.orderType === OrderType.MARKET) {
      if (!currentPrice) {
        throw new Error('Current price required for market order value');
      }
      effectivePrice = currentPrice;
    } else {
      effectivePrice = this.price || 0;
    }

    return this.quantity * effectivePrice;
  }

  /**
   * Get order display string
   */
  public getDisplayString(): string {
    let priceStr = '';
    if (this.orderType === OrderType.MARKET) {
      priceStr = 'MARKET';
    } else if (this.price !== null) {
      priceStr = `₹${this.price.toFixed(2)}`;
    }

    return `${this.side} ${this.quantity} ${this.stockSymbol} @ ${priceStr} [${this.status}]`;
  }
}
