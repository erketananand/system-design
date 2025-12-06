import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { OrderRepository } from '../repositories/OrderRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { PortfolioRepository } from '../repositories/PortfolioRepository';
import { TradeRepository } from '../repositories/TradeRepository';
import { StockRepository } from '../repositories/StockRepository';
import { OrderFactory, OrderRequest } from '../factories/OrderFactory';
import { ExchangeGateway } from './ExchangeGateway';
import { MarketDataService } from './MarketDataService';
import { AccountService } from './AccountService';
import { PortfolioService } from './PortfolioService';
import { OrderType } from '../enums/OrderType';
import { OrderSide } from '../enums/OrderSide';
import { OrderStatus } from '../enums/OrderStatus';
import { TransactionType } from '../enums/TransactionType';
import { 
  IOrderValidationStrategy,
  MarketOrderValidationStrategy,
  LimitOrderValidationStrategy,
  StopLossOrderValidationStrategy
} from '../strategies';
import { Logger } from '../utils/Logger';

export class OrderService {
  private orderRepository: OrderRepository;
  private accountRepository: AccountRepository;
  private portfolioRepository: PortfolioRepository;
  private tradeRepository: TradeRepository;
  private stockRepository: StockRepository;
  private exchangeGateway: ExchangeGateway;
  private marketDataService: MarketDataService;
  private accountService: AccountService;
  private portfolioService: PortfolioService;

  constructor(accountService: AccountService, portfolioService: PortfolioService) {
    this.orderRepository = new OrderRepository();
    this.accountRepository = new AccountRepository();
    this.portfolioRepository = new PortfolioRepository();
    this.tradeRepository = new TradeRepository();
    this.stockRepository = new StockRepository();
    this.exchangeGateway = ExchangeGateway.getInstance();
    this.marketDataService = MarketDataService.getInstance();
    this.accountService = accountService;
    this.portfolioService = portfolioService;
  }

  /**
   * Place a new order
   */
  public placeOrder(orderRequest: OrderRequest): Order {
    try {
      // Create order using factory
      const order = OrderFactory.createFromRequest(orderRequest);

      // Get account, stock, and portfolio
      const account = this.accountRepository.findByUserId(order.userId);
      if (!account) {
        throw new Error('Account not found');
      }

      const stock = this.stockRepository.findBySymbol(order.stockSymbol);
      if (!stock) {
        throw new Error(`Stock ${order.stockSymbol} not found`);
      }

      const portfolio = this.portfolioRepository.findByUserId(order.userId);

      // Validate order using strategy pattern
      const validationStrategy = this.getValidationStrategy(order.orderType);
      validationStrategy.validate(order, account, stock, portfolio || null);

      // Block funds for buy orders
      if (order.side === OrderSide.BUY) {
        const estimatedCost = this.estimateOrderCost(order, stock.lastTradedPrice);
        account.blockAmount(estimatedCost);
        this.accountRepository.save(account);
      }

      // Save order
      this.orderRepository.save(order);
      Logger.info(`[OrderService] Order placed: ${order.getDisplayString()}`);

      // Send to exchange
      const exchangeOrderId = this.exchangeGateway.sendOrder(order);
      order.markSentToExchange(exchangeOrderId);
      this.orderRepository.update(order);

      // Attempt immediate execution (for market orders)
      if (order.orderType === OrderType.MARKET) {
        this.tryExecuteOrder(order);
      }

      return order;

    } catch (error: any) {
      Logger.error('[OrderService] Error placing order', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  public cancelOrder(userId: string, orderId: string): void {
    const order = this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: Order does not belong to user');
    }

    if (!order.isActive()) {
      throw new Error(`Order cannot be cancelled (status: ${order.status})`);
    }

    // Cancel on exchange
    if (order.exchangeOrderId) {
      this.exchangeGateway.cancelOrder(order.exchangeOrderId);
    }

    // Release blocked funds for buy orders
    if (order.side === OrderSide.BUY) {
      const account = this.accountRepository.findByUserId(userId);
      if (account) {
        const stock = this.stockRepository.findBySymbol(order.stockSymbol);
        if (stock) {
          const estimatedCost = this.estimateOrderCost(order, stock.lastTradedPrice);
          account.releaseBlockedAmount(estimatedCost);
          this.accountRepository.save(account);
        }
      }
    }

    order.markCancelled('Cancelled by user');
    this.orderRepository.update(order);
    Logger.info(`[OrderService] Order cancelled: ${orderId}`);
  }

  /**
   * Try to execute an order
   */
  private tryExecuteOrder(order: Order): void {
    try {
      const trade = this.exchangeGateway.simulateExecution(order);

      if (trade) {
        // Mark order as executed
        order.markExecuted();
        this.orderRepository.update(order);

        // Save trade
        this.tradeRepository.save(trade);

        // Process trade settlement
        this.settleTrade(trade, order);

        Logger.success(`[OrderService] Order executed: ${order.id}`);
      }
    } catch (error) {
      Logger.error(`[OrderService] Error executing order ${order.id}`, error);
      order.markRejected('Execution failed');
      this.orderRepository.update(order);
    }
  }

  /**
   * Settle trade (update account and portfolio)
   */
  private settleTrade(trade: Trade, order: Order): void {
    const account = this.accountRepository.findByUserId(trade.userId);
    if (!account) {
      throw new Error('Account not found for settlement');
    }

    if (trade.side === OrderSide.BUY) {
      // Release blocked amount
      const estimatedCost = this.estimateOrderCost(order, trade.price);
      account.releaseBlockedAmount(estimatedCost);

      // Debit actual cost
      const actualCost = trade.getNetAmount();
      account.debit(actualCost);

      // Record transaction
      this.accountService.recordTradeTransaction(
        trade.userId,
        TransactionType.TRADE_DEBIT,
        -actualCost,
        `BUY ${trade.quantity} ${trade.stockSymbol} @ ₹${trade.price.toFixed(2)}`
      );

      // Update portfolio
      this.portfolioService.updateHoldingsFromTrade(trade);

    } else if (trade.side === OrderSide.SELL) {
      // Credit proceeds
      const proceeds = trade.getNetAmount();
      account.credit(proceeds);

      // Record transaction
      this.accountService.recordTradeTransaction(
        trade.userId,
        TransactionType.TRADE_CREDIT,
        proceeds,
        `SELL ${trade.quantity} ${trade.stockSymbol} @ ₹${trade.price.toFixed(2)}`
      );

      // Update portfolio
      this.portfolioService.updateHoldingsFromTrade(trade);
    }

    this.accountRepository.save(account);
  }

  /**
   * Get orders for user
   */
  public getOrdersForUser(userId: string): Order[] {
    return this.orderRepository.findByUserId(userId);
  }

  /**
   * Get open orders for user
   */
  public getOpenOrdersForUser(userId: string): Order[] {
    return this.orderRepository.findOpenOrdersByUser(userId);
  }

  /**
   * Get order by ID
   */
  public getOrderById(orderId: string): Order | undefined {
    return this.orderRepository.findById(orderId);
  }

  /**
   * Estimate order cost (for blocking funds)
   */
  private estimateOrderCost(order: Order, currentPrice: number): number {
    let price: number;
    if (order.orderType === OrderType.MARKET) {
      price = currentPrice;
    } else {
      price = order.price || currentPrice;
    }

    const tradeValue = order.quantity * price;
    // Add 2% buffer for charges
    return tradeValue * 1.02;
  }

  /**
   * Get validation strategy based on order type
   */
  private getValidationStrategy(orderType: OrderType): IOrderValidationStrategy {
    switch (orderType) {
      case OrderType.MARKET:
        return new MarketOrderValidationStrategy();
      case OrderType.LIMIT:
        return new LimitOrderValidationStrategy();
      case OrderType.STOP_LOSS:
      case OrderType.BRACKET:
      case OrderType.COVER:
        return new StopLossOrderValidationStrategy();
      default:
        return new MarketOrderValidationStrategy();
    }
  }
}
