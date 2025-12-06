import { IRepository } from './IRepository';
import { Account } from '../models/Account';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class AccountRepository implements IRepository<Account> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Account | undefined {
    return this.db.accounts.get(id);
  }

  public findAll(): Account[] {
    return Array.from(this.db.accounts.values());
  }

  public save(account: Account): Account {
    this.db.indexAccount(account);
    return account;
  }

  public delete(id: string): boolean {
    const account = this.db.accounts.get(id);
    if (account) {
      this.db.accountsByUserId.delete(account.userId);
    }
    return this.db.accounts.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.accounts.has(id);
  }

  public count(): number {
    return this.db.accounts.size;
  }

  public clear(): void {
    this.db.accounts.clear();
    this.db.accountsByUserId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Account | undefined {
    return this.db.accountsByUserId.get(userId);
  }

  public existsByUserId(userId: string): boolean {
    return this.db.accountsByUserId.has(userId);
  }

  public findAccountsWithBalance(minBalance: number): Account[] {
    return Array.from(this.db.accounts.values()).filter(
      account => account.balance >= minBalance
    );
  }

  public getTotalBalance(): number {
    return Array.from(this.db.accounts.values()).reduce(
      (sum, account) => sum + account.balance,
      0
    );
  }
}
