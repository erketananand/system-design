export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

/**
 * Strategy Pattern Interface for Payment Methods
 */
export interface IPaymentMethod {
  /**
   * Process payment
   */
  processPayment(amount: number): PaymentResult;

  /**
   * Refund payment
   */
  refund(transactionId: string, amount: number): boolean;

  /**
   * Get payment method name
   */
  getMethodName(): string;
}
