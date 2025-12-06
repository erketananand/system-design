import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { AccountRepository } from '../repositories/AccountRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionType } from '../enums/TransactionType';
import { Logger } from '../utils/Logger';

export class AccountService {
  private accountRepository: AccountRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.accountRepository = new AccountRepository();
    this.transactionRepository = new TransactionRepository();
  }

  /**
   * Create account for user
   */
  public createAccount(userId: string, initialBalance: number = 0): Account {
    if (this.accountRepository.existsByUserId(userId)) {
      throw new Error('Account already exists for this user');
    }

    const account = new Account(userId, initialBalance);
    this.accountRepository.save(account);

    if (initialBalance > 0) {
      const transaction = new Transaction(
        userId,
        TransactionType.DEPOSIT,
        initialBalance,
        'Initial deposit'
      );
      this.transactionRepository.save(transaction);
    }

    Logger.success(`[AccountService] Account created for user ${userId} with balance ₹${initialBalance}`);
    return account;
  }

  /**
   * Get account for user
   */
  public getAccount(userId: string): Account {
    const account = this.accountRepository.findByUserId(userId);
    if (!account) {
      throw new Error('Account not found for user');
    }
    return account;
  }

  /**
   * Deposit funds to account
   */
  public deposit(userId: string, amount: number): Transaction {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const account = this.getAccount(userId);
    account.credit(amount);
    this.accountRepository.save(account);

    const transaction = new Transaction(
      userId,
      TransactionType.DEPOSIT,
      amount,
      `Deposit of ₹${amount.toFixed(2)}`
    );
    this.transactionRepository.save(transaction);

    Logger.success(`[AccountService] Deposited ₹${amount.toFixed(2)} to user ${userId}`);
    return transaction;
  }

  /**
   * Withdraw funds from account
   */
  public withdraw(userId: string, amount: number): Transaction {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    const account = this.getAccount(userId);

    if (account.getAvailableBalance() < amount) {
      throw new Error(
        `Insufficient available balance. Available: ₹${account.getAvailableBalance().toFixed(2)}, Requested: ₹${amount.toFixed(2)}`
      );
    }

    account.debit(amount);
    this.accountRepository.save(account);

    const transaction = new Transaction(
      userId,
      TransactionType.WITHDRAWAL,
      -amount,
      `Withdrawal of ₹${amount.toFixed(2)}`
    );
    this.transactionRepository.save(transaction);

    Logger.success(`[AccountService] Withdrew ₹${amount.toFixed(2)} from user ${userId}`);
    return transaction;
  }

  /**
   * Get transaction history
   */
  public getTransactions(userId: string): Transaction[] {
    return this.transactionRepository.findByUserId(userId);
  }

  /**
   * Get recent transactions
   */
  public getRecentTransactions(userId: string, limit: number = 10): Transaction[] {
    return this.transactionRepository.getRecentTransactions(userId, limit);
  }

  /**
   * Record trade-related transaction
   */
  public recordTradeTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    description: string
  ): Transaction {
    const transaction = new Transaction(userId, type, amount, description);
    this.transactionRepository.save(transaction);
    return transaction;
  }
}
