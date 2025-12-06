import { Order } from '../models/Order';
import { OrderType } from '../enums/OrderType';
import { OrderSide } from '../enums/OrderSide';
import { OrderValidity } from '../enums/OrderValidity';

export interface OrderRequest {
  userId: string;
  stockSymbol: string;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  validity?: OrderValidity;
}

export class OrderFactory {

  /**
   * Create a market order
   */
  static createMarketOrder(
    userId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    validity: OrderValidity = OrderValidity.DAY
  ): Order {
    return new Order(
      userId,
      stockSymbol,
      OrderType.MARKET,
      side,
      quantity,
      null,
      null,
      validity
    );
  }

  /**
   * Create a limit order
   */
  static createLimitOrder(
    userId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    price: number,
    validity: OrderValidity = OrderValidity.DAY
  ): Order {
    if (price <= 0) {
      throw new Error('Limit price must be positive');
    }

    return new Order(
      userId,
      stockSymbol,
      OrderType.LIMIT,
      side,
      quantity,
      price,
      null,
      validity
    );
  }

  /**
   * Create a stop-loss order
   */
  static createStopLossOrder(
    userId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    triggerPrice: number,
    validity: OrderValidity = OrderValidity.DAY
  ): Order {
    if (triggerPrice <= 0) {
      throw new Error('Trigger price must be positive');
    }

    return new Order(
      userId,
      stockSymbol,
      OrderType.STOP_LOSS,
      side,
      quantity,
      null,
      triggerPrice,
      validity
    );
  }

  /**
   * Create a bracket order (simplified)
   */
  static createBracketOrder(
    userId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    price: number,
    targetPrice: number,
    stopLossPrice: number
  ): Order {
    if (price <= 0 || targetPrice <= 0 || stopLossPrice <= 0) {
      throw new Error('All prices must be positive');
    }

    // For now, create the entry order (bracket logic to be implemented in service)
    return new Order(
      userId,
      stockSymbol,
      OrderType.BRACKET,
      side,
      quantity,
      price,
      stopLossPrice,
      OrderValidity.DAY
    );
  }

  /**
   * Create a cover order (market order with stop-loss)
   */
  static createCoverOrder(
    userId: string,
    stockSymbol: string,
    side: OrderSide,
    quantity: number,
    triggerPrice: number
  ): Order {
    if (triggerPrice <= 0) {
      throw new Error('Trigger price must be positive');
    }

    return new Order(
      userId,
      stockSymbol,
      OrderType.COVER,
      side,
      quantity,
      null,
      triggerPrice,
      OrderValidity.DAY
    );
  }

  /**
   * Create order from request object
   */
  static createFromRequest(request: OrderRequest): Order {
    switch (request.orderType) {
      case OrderType.MARKET:
        return this.createMarketOrder(
          request.userId,
          request.stockSymbol,
          request.side,
          request.quantity,
          request.validity
        );

      case OrderType.LIMIT:
        if (!request.price) {
          throw new Error('Limit order requires price');
        }
        return this.createLimitOrder(
          request.userId,
          request.stockSymbol,
          request.side,
          request.quantity,
          request.price,
          request.validity
        );

      case OrderType.STOP_LOSS:
        if (!request.triggerPrice) {
          throw new Error('Stop-loss order requires trigger price');
        }
        return this.createStopLossOrder(
          request.userId,
          request.stockSymbol,
          request.side,
          request.quantity,
          request.triggerPrice,
          request.validity
        );

      case OrderType.BRACKET:
        if (!request.price || !request.triggerPrice) {
          throw new Error('Bracket order requires price and trigger price');
        }
        // Simplified bracket order
        return this.createBracketOrder(
          request.userId,
          request.stockSymbol,
          request.side,
          request.quantity,
          request.price,
          request.price * 1.05, // 5% target
          request.triggerPrice
        );

      case OrderType.COVER:
        if (!request.triggerPrice) {
          throw new Error('Cover order requires trigger price');
        }
        return this.createCoverOrder(
          request.userId,
          request.stockSymbol,
          request.side,
          request.quantity,
          request.triggerPrice
        );

      default:
        throw new Error(`Unknown order type: ${request.orderType}`);
    }
  }
}
