import { User } from '../models/User';
import { Account } from '../models/Account';
import { Stock } from '../models/Stock';
import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { Portfolio } from '../models/Portfolio';
import { Holding } from '../models/Holding';
import { Watchlist } from '../models/Watchlist';
import { Transaction } from '../models/Transaction';

/**
 * Singleton In-Memory Database
 * Stores all entities in Maps for fast access
 */
export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Entity storage maps
  public users: Map<string, User> = new Map();
  public accounts: Map<string, Account> = new Map();
  public stocks: Map<string, Stock> = new Map();
  public orders: Map<string, Order> = new Map();
  public trades: Map<string, Trade> = new Map();
  public portfolios: Map<string, Portfolio> = new Map();
  public watchlists: Map<string, Watchlist> = new Map();
  public transactions: Map<string, Transaction> = new Map();

  // Index maps for faster queries
  public accountsByUserId: Map<string, Account> = new Map();
  public portfoliosByUserId: Map<string, Portfolio> = new Map();
  public ordersByUserId: Map<string, Order[]> = new Map();
  public tradesByUserId: Map<string, Trade[]> = new Map();
  public watchlistsByUserId: Map<string, Watchlist[]> = new Map();
  public transactionsByUserId: Map<string, Transaction[]> = new Map();
  public ordersByExchangeId: Map<string, Order> = new Map();
  public stocksBySymbol: Map<string, Stock> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  /**
   * Clear all data (useful for testing)
   */
  public clearAll(): void {
    this.users.clear();
    this.accounts.clear();
    this.stocks.clear();
    this.orders.clear();
    this.trades.clear();
    this.portfolios.clear();
    this.watchlists.clear();
    this.transactions.clear();

    // Clear indexes
    this.accountsByUserId.clear();
    this.portfoliosByUserId.clear();
    this.ordersByUserId.clear();
    this.tradesByUserId.clear();
    this.watchlistsByUserId.clear();
    this.transactionsByUserId.clear();
    this.ordersByExchangeId.clear();
    this.stocksBySymbol.clear();

    console.log('[DATABASE] All data cleared');
  }

  /**
   * Get database statistics
   */
  public getStats(): Record<string, number> {
    return {
      users: this.users.size,
      accounts: this.accounts.size,
      stocks: this.stocks.size,
      orders: this.orders.size,
      trades: this.trades.size,
      portfolios: this.portfolios.size,
      watchlists: this.watchlists.size,
      transactions: this.transactions.size
    };
  }

  /**
   * Print database statistics
   */
  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    console.log('='.repeat(50));
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(20)}: ${value}`);
    });
    console.log('='.repeat(50));
  }

  /**
   * Add user to index
   */
  public indexUser(user: User): void {
    this.users.set(user.id, user);
  }

  /**
   * Add account to index
   */
  public indexAccount(account: Account): void {
    this.accounts.set(account.id, account);
    this.accountsByUserId.set(account.userId, account);
  }

  /**
   * Add stock to index
   */
  public indexStock(stock: Stock): void {
    this.stocks.set(stock.symbol, stock);
    this.stocksBySymbol.set(stock.symbol, stock);
  }

  /**
   * Add order to index
   */
  public indexOrder(order: Order): void {
    this.orders.set(order.id, order);

    // Add to user orders
    if (!this.ordersByUserId.has(order.userId)) {
      this.ordersByUserId.set(order.userId, []);
    }
    this.ordersByUserId.get(order.userId)!.push(order);

    // Add to exchange order map if exchangeOrderId exists
    if (order.exchangeOrderId) {
      this.ordersByExchangeId.set(order.exchangeOrderId, order);
    }
  }

  /**
   * Update order index when exchangeOrderId is set
   */
  public updateOrderExchangeIndex(order: Order): void {
    if (order.exchangeOrderId) {
      this.ordersByExchangeId.set(order.exchangeOrderId, order);
    }
  }

  /**
   * Add trade to index
   */
  public indexTrade(trade: Trade): void {
    this.trades.set(trade.id, trade);

    // Add to user trades
    if (!this.tradesByUserId.has(trade.userId)) {
      this.tradesByUserId.set(trade.userId, []);
    }
    this.tradesByUserId.get(trade.userId)!.push(trade);
  }

  /**
   * Add portfolio to index
   */
  public indexPortfolio(portfolio: Portfolio): void {
    this.portfolios.set(portfolio.id, portfolio);
    this.portfoliosByUserId.set(portfolio.userId, portfolio);
  }

  /**
   * Add watchlist to index
   */
  public indexWatchlist(watchlist: Watchlist): void {
    this.watchlists.set(watchlist.id, watchlist);

    // Add to user watchlists
    if (!this.watchlistsByUserId.has(watchlist.userId)) {
      this.watchlistsByUserId.set(watchlist.userId, []);
    }
    this.watchlistsByUserId.get(watchlist.userId)!.push(watchlist);
  }

  /**
   * Add transaction to index
   */
  public indexTransaction(transaction: Transaction): void {
    this.transactions.set(transaction.id, transaction);

    // Add to user transactions
    if (!this.transactionsByUserId.has(transaction.userId)) {
      this.transactionsByUserId.set(transaction.userId, []);
    }
    this.transactionsByUserId.get(transaction.userId)!.push(transaction);
  }

  /**
   * Remove order from indexes
   */
  public removeOrderFromIndexes(orderId: string): void {
    const order = this.orders.get(orderId);
    if (order) {
      this.orders.delete(orderId);

      // Remove from user orders
      const userOrders = this.ordersByUserId.get(order.userId);
      if (userOrders) {
        const index = userOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          userOrders.splice(index, 1);
        }
      }

      // Remove from exchange order map
      if (order.exchangeOrderId) {
        this.ordersByExchangeId.delete(order.exchangeOrderId);
      }
    }
  }

  /**
   * Remove watchlist from indexes
   */
  public removeWatchlistFromIndexes(watchlistId: string): void {
    const watchlist = this.watchlists.get(watchlistId);
    if (watchlist) {
      this.watchlists.delete(watchlistId);

      // Remove from user watchlists
      const userWatchlists = this.watchlistsByUserId.get(watchlist.userId);
      if (userWatchlists) {
        const index = userWatchlists.findIndex(w => w.id === watchlistId);
        if (index !== -1) {
          userWatchlists.splice(index, 1);
        }
      }
    }
  }

  /**
   * Get total database size in memory (approximate)
   */
  public getApproximateSize(): string {
    const stats = this.getStats();
    const totalEntities = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const approximateSizeKB = totalEntities * 2; // Rough estimate: 2KB per entity

    if (approximateSizeKB < 1024) {
      return `${approximateSizeKB} KB`;
    } else {
      return `${(approximateSizeKB / 1024).toFixed(2)} MB`;
    }
  }

  /**
   * Export database snapshot (for debugging)
   */
  public exportSnapshot(): any {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      approximateSize: this.getApproximateSize(),
      users: Array.from(this.users.values()),
      accounts: Array.from(this.accounts.values()),
      stocks: Array.from(this.stocks.values()),
      orders: Array.from(this.orders.values()),
      trades: Array.from(this.trades.values()),
      portfolios: Array.from(this.portfolios.values()).map(p => ({
        ...p,
        holdings: Array.from(p.holdings.values())
      })),
      watchlists: Array.from(this.watchlists.values()),
      transactions: Array.from(this.transactions.values())
    };
  }
}
