import { IOrderValidationStrategy } from './IOrderValidationStrategy';
import { Order } from '../models/Order';
import { Account } from '../models/Account';
import { Portfolio } from '../models/Portfolio';
import { Stock } from '../models/Stock';
import { OrderSide } from '../enums/OrderSide';

export class LimitOrderValidationStrategy implements IOrderValidationStrategy {

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

    // Validate price
    if (!order.price || order.price <= 0) {
      throw new Error('Limit order must have a valid price');
    }

    // Validate price is within reasonable range (±20% of current price)
    const minPrice = stock.lastTradedPrice * 0.8;
    const maxPrice = stock.lastTradedPrice * 1.2;
    if (order.price < minPrice || order.price > maxPrice) {
      throw new Error(
        `Limit price ₹${order.price} is outside acceptable range (₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)})`
      );
    }

    // For BUY orders, validate sufficient funds
    if (order.side === OrderSide.BUY) {
      const requiredAmount = order.quantity * order.price * 1.01; // 1% buffer for charges
      if (account.getAvailableBalance() < requiredAmount) {
        throw new Error(
          `Insufficient funds. Required: ₹${requiredAmount.toFixed(2)}, Available: ₹${account.getAvailableBalance().toFixed(2)}`
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
    return 'LimitOrderValidation';
  }
}
