import { IdGenerator } from '../utils/IdGenerator';
import { TransactionType } from '../enums/TransactionType';

export class Transaction {
  public readonly id: string;
  public readonly userId: string;
  public readonly type: TransactionType;
  public readonly amount: number;
  public readonly description: string;
  public readonly createdAt: Date;

  constructor(
    userId: string,
    type: TransactionType,
    amount: number,
    description: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateTransactionId();
    this.userId = userId;
    this.type = type;
    this.amount = amount;
    this.description = description;
    this.createdAt = new Date();
  }

  /**
   * Check if transaction is credit (increases balance)
   */
  public isCredit(): boolean {
    return this.type === TransactionType.DEPOSIT || 
           this.type === TransactionType.TRADE_CREDIT ||
           (this.type === TransactionType.ADJUSTMENT && this.amount > 0);
  }

  /**
   * Check if transaction is debit (decreases balance)
   */
  public isDebit(): boolean {
    return this.type === TransactionType.WITHDRAWAL || 
           this.type === TransactionType.CHARGE ||
           this.type === TransactionType.TRADE_DEBIT ||
           (this.type === TransactionType.ADJUSTMENT && this.amount < 0);
  }

  /**
   * Get display string
   */
  public getDisplayString(): string {
    const sign = this.isCredit() ? '+' : '-';
    return `${this.type}: ${sign}₹${Math.abs(this.amount).toFixed(2)} - ${this.description}`;
  }

  /**
   * Get formatted amount with sign
   */
  public getFormattedAmount(): string {
    const sign = this.isCredit() ? '+' : '-';
    return `${sign}₹${Math.abs(this.amount).toFixed(2)}`;
  }
}
