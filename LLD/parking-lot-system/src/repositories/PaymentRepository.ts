import { IRepository } from './IRepository';
import { Payment } from '../models/Payment';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { PaymentStatus } from '../enums/PaymentStatus';

export class PaymentRepository implements IRepository<Payment> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Payment | undefined {
    return this.db.payments.get(id);
  }

  public findAll(): Payment[] {
    return Array.from(this.db.payments.values());
  }

  public save(entity: Payment): Payment {
    this.db.payments.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.payments.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.payments.has(id);
  }

  public count(): number {
    return this.db.payments.size;
  }

  public clear(): void {
    this.db.payments.clear();
  }

  // Custom query methods
  public findByTicketId(ticketId: string): Payment | undefined {
    return Array.from(this.db.payments.values()).find(
      p => p.ticketId === ticketId
    );
  }

  public findByStatus(status: PaymentStatus): Payment[] {
    return Array.from(this.db.payments.values()).filter(
      p => p.status === status
    );
  }

  public getTotalRevenue(): number {
    return Array.from(this.db.payments.values())
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  public getTotalPendingAmount(): number {
    return Array.from(this.db.payments.values())
      .filter(p => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + p.amount, 0);
  }
}
