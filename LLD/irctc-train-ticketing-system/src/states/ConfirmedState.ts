import { IBookingState } from './IBookingState';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';
import { CancelledState } from './CancelledState';

export class ConfirmedState implements IBookingState {
  private readonly confirmedAt: Date;

  constructor() {
    this.confirmedAt = new Date();
  }

  confirm(booking: Booking): void {
    console.log(`Booking ${booking.pnr} is already confirmed.`);
  }

  cancel(booking: Booking): void {
    const refundAmount = booking.calculateRefund();
    booking.setState(new CancelledState(refundAmount));

    // Clear seat assignments for all passengers
    booking.passengers.forEach(p => p.clearSeat());

    console.log(`Booking ${booking.pnr} cancelled. Refund: ₹${refundAmount}`);
  }

  addToWaitlist(booking: Booking, position: number): void {
    throw new Error('Cannot add to waitlist - booking is already confirmed.');
  }

  promoteFromWaitlist(booking: Booking): void {
    throw new Error('Cannot promote from waitlist - booking is already confirmed.');
  }

  getStatus(): BookingStatus {
    return BookingStatus.CONFIRMED;
  }

  getStateName(): string {
    return 'Confirmed';
  }

  getConfirmedAt(): Date {
    return this.confirmedAt;
  }
}
