import { IdGenerator } from '../utils/IdGenerator';
import { PaymentStatus } from '../enums/PaymentStatus';
import { PaymentMethod } from '../enums/PaymentMethod';

export class Payment {
  public readonly id: string;
  public ticketId: string;
  public amount: number;
  public baseAmount: number;
  public overstayPenalty: number;
  public discounts: number;
  public status: PaymentStatus;
  public method: PaymentMethod | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    ticketId: string,
    baseAmount: number,
    overstayPenalty: number = 0,
    discounts: number = 0,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.ticketId = ticketId;
    this.baseAmount = baseAmount;
    this.overstayPenalty = overstayPenalty;
    this.discounts = discounts;
    this.amount = this.calculateTotal();
    this.status = PaymentStatus.PENDING;
    this.method = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private calculateTotal(): number {
    return Math.max(0, this.baseAmount + this.overstayPenalty - this.discounts);
  }

  public markPaid(method: PaymentMethod): void {
    if (this.status === PaymentStatus.PAID) {
      throw new Error(`Payment ${this.id} is already paid`);
    }
    this.status = PaymentStatus.PAID;
    this.method = method;
    this.update();
  }

  public markFailed(): void {
    this.status = PaymentStatus.FAILED;
    this.update();
  }

  public applyDiscount(discountAmount: number): void {
    this.discounts += discountAmount;
    this.amount = this.calculateTotal();
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
