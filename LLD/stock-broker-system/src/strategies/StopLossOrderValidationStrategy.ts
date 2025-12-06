import { IOrderValidationStrategy } from './IOrderValidationStrategy';
import { Order } from '../models/Order';
import { Account } from '../models/Account';
import { Portfolio } from '../models/Portfolio';
import { Stock } from '../models/Stock';
import { OrderSide } from '../enums/OrderSide';

export class StopLossOrderValidationStrategy implements IOrderValidationStrategy {

  public validate(
    order: Order, 
    account: Account, 
    stock: Stock, 
    portfolio: Portfolio | null
  ): void {
    // Validate quantity
    if (order.quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }

    // Validate trigger price
    if (!order.triggerPrice || order.triggerPrice <= 0) {
      throw new Error('Stop-loss order must have a valid trigger price');
    }

    // For BUY stop-loss, trigger should be above current price
    if (order.side === OrderSide.BUY) {
      if (order.triggerPrice <= stock.lastTradedPrice) {
        throw new Error(
          `Buy stop-loss trigger (₹${order.triggerPrice}) must be above current price (₹${stock.lastTradedPrice})`
        );
      }

      const estimatedCost = order.quantity * order.triggerPrice * 1.02; // 2% buffer
      if (account.getAvailableBalance() < estimatedCost) {
        throw new Error(
          `Insufficient funds. Required: ₹${estimatedCost.toFixed(2)}, Available: ₹${account.getAvailableBalance().toFixed(2)}`
        );
      }
    }

    // For SELL stop-loss, trigger should be below current price
    if (order.side === OrderSide.SELL) {
      if (order.triggerPrice >= stock.lastTradedPrice) {
        throw new Error(
          `Sell stop-loss trigger (₹${order.triggerPrice}) must be below current price (₹${stock.lastTradedPrice})`
        );
      }

      if (!portfolio) {
        throw new Error('No portfolio found for user');
      }

      const holding = portfolio.getHolding(order.stockSymbol);
      if (!holding || holding.quantity < order.quantity) {
        const availableQty = holding ? holding.quantity : 0;
        throw new Error(
          `Insufficient holdings. Required: ${order.quantity}, Available: ${availableQty}`
        );
      }
    }
  }

  public getStrategyName(): string {
    return 'StopLossOrderValidation';
  }
}
