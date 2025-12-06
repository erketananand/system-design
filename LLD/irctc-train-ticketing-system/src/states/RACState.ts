import { IBookingState } from './IBookingState';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';
import { ConfirmedState } from './ConfirmedState';
import { CancelledState } from './CancelledState';

export class RACState implements IBookingState {
  private racPosition: number;

  constructor(racPosition: number) {
    this.racPosition = racPosition;
  }

  confirm(booking: Booking): void {
    console.log(`Booking ${booking.pnr} is in RAC position ${this.racPosition}.`);
  }

  cancel(booking: Booking): void {
    const refundAmount = booking.calculateRefund();
    booking.setState(new CancelledState(refundAmount));

    booking.passengers.forEach(p => p.clearSeat());

    console.log(`RAC Booking ${booking.pnr} cancelled. Refund: ₹${refundAmount}`);
  }

  addToWaitlist(booking: Booking, position: number): void {
    throw new Error('Cannot add to waitlist - booking is already in RAC.');
  }

  promoteFromWaitlist(booking: Booking): void {
    // Promote from RAC to Confirmed
    booking.setState(new ConfirmedState());

    // Update all passengers to confirmed status
    booking.passengers.forEach(p => {
      p.status = BookingStatus.CONFIRMED;
      p.waitlistPosition = null;
    });

    console.log(`Booking ${booking.pnr} promoted from RAC to CONFIRMED!`);
  }

  getStatus(): BookingStatus {
    return BookingStatus.RAC;
  }

  getStateName(): string {
    return `RAC (Position: ${this.racPosition})`;
  }

  getRACPosition(): number {
    return this.racPosition;
  }

  setRACPosition(position: number): void {
    this.racPosition = position;
  }
}
