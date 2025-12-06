import { IdGenerator } from '../utils/IdGenerator';

export class Account {
  public readonly id: string;
  public readonly userId: string;
  public balance: number;
  public blockedAmount: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(userId: string, initialBalance: number = 0, id?: string) {
    this.id = id || IdGenerator.generateId('ACC');
    this.userId = userId;
    this.balance = initialBalance;
    this.blockedAmount = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Credit amount to account
   */
  public credit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    this.balance += amount;
    this.updatedAt = new Date();
  }

  /**
   * Debit amount from account
   */
  public debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
    this.updatedAt = new Date();
  }

  /**
   * Check if amount can be blocked
   */
  public canBlockAmount(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  /**
   * Block amount for pending order
   */
  public blockAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Block amount must be positive');
    }
    if (!this.canBlockAmount(amount)) {
      throw new Error('Insufficient available balance to block');
    }
    this.blockedAmount += amount;
    this.updatedAt = new Date();
  }

  /**
   * Release blocked amount
   */
  public releaseBlockedAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Release amount must be positive');
    }
    if (this.blockedAmount < amount) {
      throw new Error('Cannot release more than blocked amount');
    }
    this.blockedAmount -= amount;
    this.updatedAt = new Date();
  }

  /**
   * Get available balance (total - blocked)
   */
  public getAvailableBalance(): number {
    return this.balance - this.blockedAmount;
  }

  /**
   * Get account summary
   */
  public getSummary(): string {
    return `Balance: ₹${this.balance.toFixed(2)}, Available: ₹${this.getAvailableBalance().toFixed(2)}, Blocked: ₹${this.blockedAmount.toFixed(2)}`;
  }
}
