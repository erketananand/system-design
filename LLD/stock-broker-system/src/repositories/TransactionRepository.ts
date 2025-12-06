import { IRepository } from './IRepository';
import { Transaction } from '../models/Transaction';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { TransactionType } from '../enums/TransactionType';

export class TransactionRepository implements IRepository<Transaction> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Transaction | undefined {
    return this.db.transactions.get(id);
  }

  public findAll(): Transaction[] {
    return Array.from(this.db.transactions.values());
  }

  public save(transaction: Transaction): Transaction {
    this.db.indexTransaction(transaction);
    return transaction;
  }

  public delete(id: string): boolean {
    return this.db.transactions.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.transactions.has(id);
  }

  public count(): number {
    return this.db.transactions.size;
  }

  public clear(): void {
    this.db.transactions.clear();
    this.db.transactionsByUserId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Transaction[] {
    return this.db.transactionsByUserId.get(userId) || [];
  }

  public findByType(userId: string, type: TransactionType): Transaction[] {
    const userTransactions = this.findByUserId(userId);
    return userTransactions.filter(txn => txn.type === type);
  }

  public findByDateRange(userId: string, from: Date, to: Date): Transaction[] {
    const userTransactions = this.findByUserId(userId);
    return userTransactions.filter(
      txn => txn.createdAt >= from && txn.createdAt <= to
    );
  }

  public findCredits(userId: string): Transaction[] {
    const userTransactions = this.findByUserId(userId);
    return userTransactions.filter(txn => txn.isCredit());
  }

  public findDebits(userId: string): Transaction[] {
    const userTransactions = this.findByUserId(userId);
    return userTransactions.filter(txn => txn.isDebit());
  }

  public getTotalCredits(userId: string): number {
    return this.findCredits(userId).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }

  public getTotalDebits(userId: string): number {
    return this.findDebits(userId).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }

  public getRecentTransactions(userId: string, limit: number = 10): Transaction[] {
    const userTransactions = this.findByUserId(userId);
    return userTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
