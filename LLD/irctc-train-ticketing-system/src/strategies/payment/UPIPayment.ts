import { IPaymentMethod, PaymentResult } from './IPaymentMethod';
import { IdGenerator } from '../../utils/IdGenerator';

export class UPIPayment implements IPaymentMethod {
  private upiId: string;

  constructor(upiId: string) {
    this.upiId = upiId;
  }

  processPayment(amount: number): PaymentResult {
    if (!this.validateUPI()) {
      return {
        success: false,
        transactionId: '',
        message: 'Invalid UPI ID.'
      };
    }

    const transactionId = IdGenerator.generateTransactionId();

    console.log(`Processing UPI payment of ₹${amount} via ${this.upiId}...`);

    return {
      success: true,
      transactionId,
      message: `Payment of ₹${amount} successful via UPI.`
    };
  }

  refund(transactionId: string, amount: number): boolean {
    console.log(`Refunding ₹${amount} to UPI ${this.upiId} (Transaction: ${transactionId})...`);
    return true;
  }

  private validateUPI(): boolean {
    return this.upiId.includes('@') && this.upiId.length > 5;
  }

  getMethodName(): string {
    return 'UPI';
  }
}
