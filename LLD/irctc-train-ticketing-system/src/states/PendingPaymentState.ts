import { IBookingState } from './IBookingState';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';
import { ConfirmedState } from './ConfirmedState';
import { CancelledState } from './CancelledState';

export class PendingPaymentState implements IBookingState {
  confirm(booking: Booking): void {
    // After successful payment, move to confirmed
    booking.setState(new ConfirmedState());
    console.log(`Booking ${booking.pnr} confirmed after payment.`);
  }

  cancel(booking: Booking): void {
    booking.setState(new CancelledState(0)); // No refund for unpaid bookings
    console.log(`Booking ${booking.pnr} cancelled (payment pending).`);
  }

  addToWaitlist(booking: Booking, position: number): void {
    throw new Error('Cannot add to waitlist - payment is pending.');
  }

  promoteFromWaitlist(booking: Booking): void {
    throw new Error('Cannot promote from waitlist - payment is pending.');
  }

  getStatus(): BookingStatus {
    return BookingStatus.PENDING_PAYMENT;
  }

  getStateName(): string {
    return 'PendingPayment';
  }
}
