import { IRepository } from './IRepository';
import { Trade } from '../models/Trade';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { OrderSide } from '../enums/OrderSide';

export class TradeRepository implements IRepository<Trade> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Trade | undefined {
    return this.db.trades.get(id);
  }

  public findAll(): Trade[] {
    return Array.from(this.db.trades.values());
  }

  public save(trade: Trade): Trade {
    this.db.indexTrade(trade);
    return trade;
  }

  public delete(id: string): boolean {
    return this.db.trades.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.trades.has(id);
  }

  public count(): number {
    return this.db.trades.size;
  }

  public clear(): void {
    this.db.trades.clear();
    this.db.tradesByUserId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Trade[] {
    return this.db.tradesByUserId.get(userId) || [];
  }

  public findByOrderId(orderId: string): Trade[] {
    return Array.from(this.db.trades.values()).filter(
      trade => trade.orderId === orderId
    );
  }

  public findByStockSymbol(stockSymbol: string): Trade[] {
    return Array.from(this.db.trades.values()).filter(
      trade => trade.stockSymbol === stockSymbol.toUpperCase()
    );
  }

  public findByUserAndStock(userId: string, stockSymbol: string): Trade[] {
    const userTrades = this.findByUserId(userId);
    return userTrades.filter(
      trade => trade.stockSymbol === stockSymbol.toUpperCase()
    );
  }

  public findByDateRange(userId: string, from: Date, to: Date): Trade[] {
    const userTrades = this.findByUserId(userId);
    return userTrades.filter(
      trade => trade.executedAt >= from && trade.executedAt <= to
    );
  }

  public findBySide(userId: string, side: OrderSide): Trade[] {
    const userTrades = this.findByUserId(userId);
    return userTrades.filter(trade => trade.side === side);
  }

  public getTotalTradeValue(userId: string): number {
    const userTrades = this.findByUserId(userId);
    return userTrades.reduce((sum, trade) => sum + trade.getTradeValue(), 0);
  }

  public getTotalCharges(userId: string): number {
    const userTrades = this.findByUserId(userId);
    return userTrades.reduce((sum, trade) => sum + trade.totalCharges, 0);
  }
}
