import { IPaymentMethod, PaymentResult } from './IPaymentMethod';
import { IdGenerator } from '../../utils/IdGenerator';

export class NetBankingPayment implements IPaymentMethod {
  private bankName: string;
  private accountNumber: string;

  constructor(bankName: string, accountNumber: string) {
    this.bankName = bankName;
    this.accountNumber = accountNumber;
  }

  processPayment(amount: number): PaymentResult {
    if (!this.validateBankDetails()) {
      return {
        success: false,
        transactionId: '',
        message: 'Invalid bank details.'
      };
    }

    const transactionId = IdGenerator.generateTransactionId();

    console.log(`Processing Net Banking payment of ₹${amount} via ${this.bankName}...`);

    return {
      success: true,
      transactionId,
      message: `Payment of ₹${amount} successful via Net Banking (${this.bankName}).`
    };
  }

  refund(transactionId: string, amount: number): boolean {
    console.log(`Refunding ₹${amount} to ${this.bankName} account (Transaction: ${transactionId})...`);
    return true;
  }

  private validateBankDetails(): boolean {
    return this.bankName.length > 0 && this.accountNumber.length >= 10;
  }

  getMethodName(): string {
    return `Net Banking (${this.bankName})`;
  }
}
