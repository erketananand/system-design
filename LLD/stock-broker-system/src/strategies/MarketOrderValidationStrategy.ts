import { IOrderValidationStrategy } from './IOrderValidationStrategy';
import { Order } from '../models/Order';
import { Account } from '../models/Account';
import { Portfolio } from '../models/Portfolio';
import { Stock } from '../models/Stock';
import { OrderSide } from '../enums/OrderSide';

export class MarketOrderValidationStrategy implements IOrderValidationStrategy {

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

    // For BUY orders, validate sufficient funds
    if (order.side === OrderSide.BUY) {
      const estimatedCost = order.quantity * stock.lastTradedPrice * 1.01; // 1% buffer
      if (account.getAvailableBalance() < estimatedCost) {
        throw new Error(
          `Insufficient funds. Required: ₹${estimatedCost.toFixed(2)}, Available: ₹${account.getAvailableBalance().toFixed(2)}`
        );
      }
    }

    // For SELL orders, validate sufficient holdings
    if (order.side === OrderSide.SELL) {
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
    return 'MarketOrderValidation';
  }
}
