import { Order } from '../models/Order';
import { OrderStatus } from '../enums/OrderStatus';
import { OrderType } from '../enums/OrderType';
import { OrderSide } from '../enums/OrderSide';
import { Trade } from '../models/Trade';
import { MarketDataService } from './MarketDataService';
import { ChargeCalculatorService } from './ChargeCalculatorService';
import { Logger } from '../utils/Logger';
import { IdGenerator } from '../utils/IdGenerator';

/**
 * Singleton gateway to simulate exchange (NSE/BSE) communication
 */
export class ExchangeGateway {
  private static instance: ExchangeGateway;
  private marketDataService: MarketDataService;
  private chargeCalculator: ChargeCalculatorService;

  private constructor() {
    this.marketDataService = MarketDataService.getInstance();
    this.chargeCalculator = new ChargeCalculatorService();
    Logger.info('[ExchangeGateway] Initialized');
  }

  public static getInstance(): ExchangeGateway {
    if (!ExchangeGateway.instance) {
      ExchangeGateway.instance = new ExchangeGateway();
    }
    return ExchangeGateway.instance;
  }

  /**
   * Send order to exchange
   * Returns exchange order ID
   */
  public sendOrder(order: Order): string {
    const exchangeOrderId = IdGenerator.generateId('EXG');
    Logger.info(`[ExchangeGateway] Order ${order.id} sent to exchange as ${exchangeOrderId}`);
    return exchangeOrderId;
  }

  /**
   * Cancel order on exchange
   */
  public cancelOrder(exchangeOrderId: string): boolean {
    Logger.info(`[ExchangeGateway] Order ${exchangeOrderId} cancelled on exchange`);
    return true;
  }

  /**
   * Get order status from exchange
   */
  public getOrderStatus(exchangeOrderId: string): OrderStatus {
    // Simulated - in real system, would query exchange
    return OrderStatus.EXECUTED;
  }

  /**
   * Simulate order execution
   * Returns Trade if executed, null if not
   */
  public simulateExecution(order: Order): Trade | null {
    try {
      const stock = this.marketDataService.getStock(order.stockSymbol);
      if (!stock) {
        Logger.error(`[ExchangeGateway] Stock ${order.stockSymbol} not found`);
        return null;
      }

      let executionPrice: number;

      // Determine execution price based on order type
      switch (order.orderType) {
        case OrderType.MARKET:
          executionPrice = stock.lastTradedPrice;
          break;

        case OrderType.LIMIT:
          // Simulate limit order execution
          if (!order.price) {
            Logger.error('[ExchangeGateway] Limit order without price');
            return null;
          }
          // For buy, execute if limit price >= current price
          // For sell, execute if limit price <= current price
          if (order.side === OrderSide.BUY && order.price >= stock.lastTradedPrice) {
            executionPrice = stock.lastTradedPrice;
          } else if (order.side === OrderSide.SELL && order.price <= stock.lastTradedPrice) {
            executionPrice = stock.lastTradedPrice;
          } else {
            Logger.debug(`[ExchangeGateway] Limit order ${order.id} not executed (price condition not met)`);
            return null;
          }
          break;

        case OrderType.STOP_LOSS:
          // Simulate stop-loss trigger
          if (!order.triggerPrice) {
            Logger.error('[ExchangeGateway] Stop-loss order without trigger price');
            return null;
          }
          // Check if trigger condition met
          if (order.side === OrderSide.BUY && stock.lastTradedPrice >= order.triggerPrice) {
            executionPrice = stock.lastTradedPrice;
          } else if (order.side === OrderSide.SELL && stock.lastTradedPrice <= order.triggerPrice) {
            executionPrice = stock.lastTradedPrice;
          } else {
            Logger.debug(`[ExchangeGateway] Stop-loss order ${order.id} not triggered`);
            return null;
          }
          break;

        case OrderType.BRACKET:
        case OrderType.COVER:
          // Simplified execution at market price
          executionPrice = stock.lastTradedPrice;
          break;

        default:
          Logger.error(`[ExchangeGateway] Unknown order type: ${order.orderType}`);
          return null;
      }

      // Calculate charges
      const tradeValue = order.quantity * executionPrice;
      const charges = this.chargeCalculator.calculateTotalCharges(tradeValue, order.side);

      // Create trade
      const trade = new Trade(
        order.userId,
        order.id,
        order.stockSymbol,
        order.side,
        order.quantity,
        executionPrice,
        charges.brokerage,
        charges.taxes
      );

      // Update stock price with this trade
      this.marketDataService.updateStockPrice(order.stockSymbol, executionPrice, order.quantity);

      Logger.success(`[ExchangeGateway] Order ${order.id} executed: ${order.side} ${order.quantity} ${order.stockSymbol} @ ₹${executionPrice.toFixed(2)}`);
      return trade;

    } catch (error) {
      Logger.error('[ExchangeGateway] Error executing order', error);
      return null;
    }
  }

  /**
   * Batch execute multiple orders
   */
  public batchExecuteOrders(orders: Order[]): Trade[] {
    const trades: Trade[] = [];
    for (const order of orders) {
      const trade = this.simulateExecution(order);
      if (trade) {
        trades.push(trade);
      }
    }
    return trades;
  }
}
