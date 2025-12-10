import { Payment } from '../models/Payment';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentMethod } from '../enums/PaymentMethod';
import { PaymentStatus } from '../enums/PaymentStatus';
import { Logger } from '../utils/Logger';

export class PaymentService {
  private paymentRepo = new PaymentRepository();

  public processPayment(payment: Payment, method: PaymentMethod): boolean {
    try {
      // Simulate payment processing
      payment.markPaid(method);
      this.paymentRepo.save(payment);

      Logger.success(`Payment of $${payment.amount.toFixed(2)} processed via ${method}`);
      return true;
    } catch (error) {
      payment.markFailed();
      this.paymentRepo.save(payment);

      Logger.error(`Payment failed: ${error}`);
      return false;
    }
  }

  public getPaymentByTicketId(ticketId: string): Payment | undefined {
    return this.paymentRepo.findByTicketId(ticketId);
  }

  public getTotalRevenue(): number {
    return this.paymentRepo.getTotalRevenue();
  }

  public getPendingPayments(): Payment[] {
    return this.paymentRepo.findByStatus(PaymentStatus.PENDING);
  }

  public printRevenueReport(): void {
    const total = this.getTotalRevenue();
    const pending = this.paymentRepo.getTotalPendingAmount();
    const allPayments = this.paymentRepo.findAll();

    console.log('\n' + '='.repeat(70));
    console.log('REVENUE REPORT');
    console.log('='.repeat(70));
    console.log(`Total Payments: ${allPayments.length}`);
    console.log(`Total Revenue: $${total.toFixed(2)}`);
    console.log(`Pending Amount: $${pending.toFixed(2)}`);
    console.log('='.repeat(70) + '\n');
  }
}
