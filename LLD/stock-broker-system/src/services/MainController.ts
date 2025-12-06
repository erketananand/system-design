import { User } from '../models/User';
import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { Transaction } from '../models/Transaction';
import { Watchlist } from '../models/Watchlist';
import { UserRepository } from '../repositories/UserRepository';
import { AccountService } from './AccountService';
import { OrderService } from './OrderService';
import { PortfolioService, PortfolioSummary } from './PortfolioService';
import { WatchlistService, WatchlistStockView } from './WatchlistService';
import { MarketDataService } from './MarketDataService';
import { OrderRequest } from '../factories/OrderFactory';
import { Stock } from '../models/Stock';
import { Logger } from '../utils/Logger';

/**
 * Main Controller - Facade for all services
 * Singleton pattern
 */
export class MainController {
  private static instance: MainController;

  private userRepository: UserRepository;
  private accountService: AccountService;
  private portfolioService: PortfolioService;
  private orderService: OrderService;
  private watchlistService: WatchlistService;
  private marketDataService: MarketDataService;

  private constructor() {
    this.userRepository = new UserRepository();
    this.accountService = new AccountService();
    this.portfolioService = new PortfolioService();
    this.orderService = new OrderService(this.accountService, this.portfolioService);
    this.watchlistService = new WatchlistService();
    this.marketDataService = MarketDataService.getInstance();

    Logger.info('[MainController] Initialized');
  }

  public static getInstance(): MainController {
    if (!MainController.instance) {
      MainController.instance = new MainController();
    }
    return MainController.instance;
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Register new user
   */
  public registerUser(name: string, email: string, pan: string, bankAccountNumber: string): User {
    // Check if user already exists
    if (this.userRepository.existsByEmail(email)) {
      throw new Error('User with this email already exists');
    }

    if (this.userRepository.existsByPAN(pan)) {
      throw new Error('User with this PAN already exists');
    }

    const user = new User(name, email, pan, bankAccountNumber);
    this.userRepository.save(user);

    // Create account and portfolio
    this.accountService.createAccount(user.id, 0);
    this.portfolioService.getOrCreatePortfolio(user.id);

    Logger.success(`[MainController] User registered: ${user.email}`);
    return user;
  }

  /**
   * Get user by email (login simulation)
   */
  public getUserByEmail(email: string): User | undefined {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Get user by ID
   */
  public getUserById(userId: string): User | undefined {
    return this.userRepository.findById(userId);
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  /**
   * Deposit funds
   */
  public deposit(userId: string, amount: number): Transaction {
    return this.accountService.deposit(userId, amount);
  }

  /**
   * Withdraw funds
   */
  public withdraw(userId: string, amount: number): Transaction {
    return this.accountService.withdraw(userId, amount);
  }

  /**
   * Get account balance
   */
  public getAccountBalance(userId: string): { 
    balance: number; 
    available: number; 
    blocked: number 
  } {
    const account = this.accountService.getAccount(userId);
    return {
      balance: account.balance,
      available: account.getAvailableBalance(),
      blocked: account.blockedAmount
    };
  }

  /**
   * Get transaction history
   */
  public getTransactionHistory(userId: string, limit?: number): Transaction[] {
    if (limit) {
      return this.accountService.getRecentTransactions(userId, limit);
    }
    return this.accountService.getTransactions(userId);
  }

  // ==================== ORDER MANAGEMENT ====================

  /**
   * Place order
   */
  public placeOrder(orderRequest: OrderRequest): Order {
    return this.orderService.placeOrder(orderRequest);
  }

  /**
   * Cancel order
   */
  public cancelOrder(userId: string, orderId: string): void {
    this.orderService.cancelOrder(userId, orderId);
  }

  /**
   * Get user orders
   */
  public getUserOrders(userId: string): Order[] {
    return this.orderService.getOrdersForUser(userId);
  }

  /**
   * Get open orders
   */
  public getOpenOrders(userId: string): Order[] {
    return this.orderService.getOpenOrdersForUser(userId);
  }

  /**
   * Get order by ID
   */
  public getOrderById(orderId: string): Order | undefined {
    return this.orderService.getOrderById(orderId);
  }

  // ==================== PORTFOLIO MANAGEMENT ====================

  /**
   * Get portfolio summary
   */
  public getPortfolioSummary(userId: string): PortfolioSummary {
    return this.portfolioService.getPortfolioSummary(userId);
  }

  // ==================== WATCHLIST MANAGEMENT ====================

  /**
   * Create watchlist
   */
  public createWatchlist(userId: string, name: string): Watchlist {
    return this.watchlistService.createWatchlist(userId, name);
  }

  /**
   * Add stock to watchlist
   */
  public addStockToWatchlist(watchlistId: string, stockSymbol: string): void {
    this.watchlistService.addStockToWatchlist(watchlistId, stockSymbol);
  }

  /**
   * Remove stock from watchlist
   */
  public removeStockFromWatchlist(watchlistId: string, stockSymbol: string): void {
    this.watchlistService.removeStockFromWatchlist(watchlistId, stockSymbol);
  }

  /**
   * Get user watchlists
   */
  public getUserWatchlists(userId: string): Watchlist[] {
    return this.watchlistService.getWatchlistsForUser(userId);
  }

  /**
   * Get watchlist view with prices
   */
  public getWatchlistView(watchlistId: string): WatchlistStockView[] {
    return this.watchlistService.getWatchlistView(watchlistId);
  }

  /**
   * Delete watchlist
   */
  public deleteWatchlist(watchlistId: string, userId: string): void {
    this.watchlistService.deleteWatchlist(watchlistId, userId);
  }

  // ==================== MARKET DATA ====================

  /**
   * Get all stocks
   */
  public getAllStocks(): Stock[] {
    return this.marketDataService.getAllStocks();
  }

  /**
   * Get stock by symbol
   */
  public getStock(symbol: string): Stock | undefined {
    return this.marketDataService.getStock(symbol);
  }

  /**
   * Search stocks
   */
  public searchStocks(query: string): Stock[] {
    return this.marketDataService.searchStocks(query);
  }

  /**
   * Get top gainers
   */
  public getTopGainers(limit: number = 10): Stock[] {
    return this.marketDataService.getTopGainers(limit);
  }

  /**
   * Get top losers
   */
  public getTopLosers(limit: number = 10): Stock[] {
    return this.marketDataService.getTopLosers(limit);
  }

  /**
   * Get most active stocks
   */
  public getMostActiveStocks(limit: number = 10): Stock[] {
    return this.marketDataService.getMostActive(limit);
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize system with sample data
   */
  public initializeSystem(): void {
    Logger.info('[MainController] Initializing system...');
    this.marketDataService.loadSampleStocks();
    Logger.success('[MainController] System initialized successfully');
  }
}
