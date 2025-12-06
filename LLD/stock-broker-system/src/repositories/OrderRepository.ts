import { IRepository } from './IRepository';
import { Order } from '../models/Order';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { OrderStatus } from '../enums/OrderStatus';

export class OrderRepository implements IRepository<Order> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Order | undefined {
    return this.db.orders.get(id);
  }

  public findAll(): Order[] {
    return Array.from(this.db.orders.values());
  }

  public save(order: Order): Order {
    this.db.indexOrder(order);
    return order;
  }

  public update(order: Order): Order {
    this.db.orders.set(order.id, order);
    this.db.updateOrderExchangeIndex(order);
    return order;
  }

  public delete(id: string): boolean {
    this.db.removeOrderFromIndexes(id);
    return true;
  }

  public exists(id: string): boolean {
    return this.db.orders.has(id);
  }

  public count(): number {
    return this.db.orders.size;
  }

  public clear(): void {
    this.db.orders.clear();
    this.db.ordersByUserId.clear();
    this.db.ordersByExchangeId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Order[] {
    return this.db.ordersByUserId.get(userId) || [];
  }

  public findOpenOrdersByUser(userId: string): Order[] {
    const userOrders = this.findByUserId(userId);
    return userOrders.filter(order => order.isActive());
  }

  public findByStatus(status: OrderStatus): Order[] {
    return Array.from(this.db.orders.values()).filter(
      order => order.status === status
    );
  }

  public findByExchangeOrderId(exchangeOrderId: string): Order | undefined {
    return this.db.ordersByExchangeId.get(exchangeOrderId);
  }

  public findByStockSymbol(stockSymbol: string): Order[] {
    return Array.from(this.db.orders.values()).filter(
      order => order.stockSymbol === stockSymbol.toUpperCase()
    );
  }

  public findByUserAndStock(userId: string, stockSymbol: string): Order[] {
    const userOrders = this.findByUserId(userId);
    return userOrders.filter(
      order => order.stockSymbol === stockSymbol.toUpperCase()
    );
  }

  public findActiveOrders(): Order[] {
    return Array.from(this.db.orders.values()).filter(order => order.isActive());
  }

  public countByStatus(status: OrderStatus): number {
    return this.findByStatus(status).length;
  }
}
