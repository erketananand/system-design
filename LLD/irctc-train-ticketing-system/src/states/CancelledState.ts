import { IBookingState } from './IBookingState';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

export class CancelledState implements IBookingState {
  private readonly cancelledAt: Date;
  private readonly refundAmount: number;

  constructor(refundAmount: number) {
    this.cancelledAt = new Date();
    this.refundAmount = refundAmount;
  }

  confirm(booking: Booking): void {
    throw new Error(`Cannot confirm - booking ${booking.pnr} is already cancelled.`);
  }

  cancel(booking: Booking): void {
    console.log(`Booking ${booking.pnr} is already cancelled.`);
  }

  addToWaitlist(booking: Booking, position: number): void {
    throw new Error('Cannot add to waitlist - booking is cancelled.');
  }

  promoteFromWaitlist(booking: Booking): void {
    throw new Error('Cannot promote from waitlist - booking is cancelled.');
  }

  getStatus(): BookingStatus {
    return BookingStatus.CANCELLED;
  }

  getStateName(): string {
    return 'Cancelled';
  }

  getCancelledAt(): Date {
    return this.cancelledAt;
  }

  getRefundAmount(): number {
    return this.refundAmount;
  }
}
