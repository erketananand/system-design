import { IPaymentMethod, PaymentResult } from './IPaymentMethod';
import { IdGenerator } from '../../utils/IdGenerator';

export class CreditCardPayment implements IPaymentMethod {
  private cardNumber: string;
  private cvv: string;
  private expiryDate: string;
  private cardHolderName: string;

  constructor(cardNumber: string, cvv: string, expiryDate: string, cardHolderName: string) {
    this.cardNumber = cardNumber;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
    this.cardHolderName = cardHolderName;
  }

  processPayment(amount: number): PaymentResult {
    // Validate card details
    if (!this.validateCard()) {
      return {
        success: false,
        transactionId: '',
        message: 'Invalid card details.'
      };
    }

    // Simulate payment processing
    const transactionId = IdGenerator.generateTransactionId();

    // Simulate success (in real implementation, call payment gateway)
    console.log(`Processing Credit Card payment of ₹${amount}...`);

    return {
      success: true,
      transactionId,
      message: `Payment of ₹${amount} successful via Credit Card.`
    };
  }

  refund(transactionId: string, amount: number): boolean {
    console.log(`Refunding ₹${amount} to Credit Card (Transaction: ${transactionId})...`);
    // Simulate refund
    return true;
  }

  private validateCard(): boolean {
    // Basic validation
    return (
      this.cardNumber.length === 16 &&
      this.cvv.length === 3 &&
      this.cardHolderName.length > 0
    );
  }

  getMethodName(): string {
    return 'Credit Card';
  }
}
