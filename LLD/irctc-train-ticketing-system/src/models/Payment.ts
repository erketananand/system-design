import { IdGenerator } from '../utils/IdGenerator';
import { PaymentStatus } from '../enums/PaymentStatus';
import { IPaymentMethod } from '../strategies/payment/IPaymentMethod';

export class Payment {
  public readonly id: string;
  public bookingId: string;
  public amount: number;
  public paymentMethod: IPaymentMethod;
  public paymentStatus: PaymentStatus;
  public transactionId: string | null;
  public processedAt: Date | null;
  public readonly createdAt: Date;

  constructor(
    bookingId: string,
    amount: number,
    paymentMethod: IPaymentMethod,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.bookingId = bookingId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.paymentStatus = PaymentStatus.PENDING;
    this.transactionId = null;
    this.processedAt = null;
    this.createdAt = new Date();
  }

  /**
   * Process payment
   */
  public process(): boolean {
    const result = this.paymentMethod.processPayment(this.amount);

    if (result.success) {
      this.markSuccess(result.transactionId);
      return true;
    } else {
      this.markFailed();
      return false;
    }
  }

  /**
   * Process refund
   */
  public refund(refundAmount: number): boolean {
    if (this.paymentStatus !== PaymentStatus.SUCCESS) {
      return false;
    }

    if (!this.transactionId) {
      return false;
    }

    const result = this.paymentMethod.refund(this.transactionId, refundAmount);

    if (result) {
      if (refundAmount >= this.amount) {
        this.paymentStatus = PaymentStatus.REFUNDED;
      } else {
        this.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED;
      }
      return true;
    }

    return false;
  }

  /**
   * Get payment status
   */
  public getStatus(): PaymentStatus {
    return this.paymentStatus;
  }

  /**
   * Mark payment as successful
   */
  public markSuccess(transactionId: string): void {
    this.paymentStatus = PaymentStatus.SUCCESS;
    this.transactionId = transactionId;
    this.processedAt = new Date();
  }

  /**
   * Mark payment as failed
   */
  public markFailed(): void {
    this.paymentStatus = PaymentStatus.FAILED;
    this.processedAt = new Date();
  }

  /**
   * Get payment display info
   */
  public getDisplayInfo(): string {
    return `Payment ${this.id} | Amount: ₹${this.amount} | Status: ${this.paymentStatus}`;
  }
}
