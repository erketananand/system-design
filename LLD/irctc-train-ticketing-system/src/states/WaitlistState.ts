import { IBookingState } from './IBookingState';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';
import { RACState } from './RACState';
import { ConfirmedState } from './ConfirmedState';
import { CancelledState } from './CancelledState';

export class WaitlistState implements IBookingState {
  private waitlistPosition: number;

  constructor(waitlistPosition: number) {
    this.waitlistPosition = waitlistPosition;
  }

  confirm(booking: Booking): void {
    console.log(`Booking ${booking.pnr} is in waitlist position ${this.waitlistPosition}.`);
  }

  cancel(booking: Booking): void {
    const refundAmount = booking.calculateRefund();
    booking.setState(new CancelledState(refundAmount));

    console.log(`Waitlist Booking ${booking.pnr} cancelled. Refund: ₹${refundAmount}`);
  }

  addToWaitlist(booking: Booking, position: number): void {
    this.waitlistPosition = position;

    booking.passengers.forEach(p => p.setWaitlisted(position));

    console.log(`Booking ${booking.pnr} added to waitlist at position ${position}.`);
  }

  promoteFromWaitlist(booking: Booking): void {
    // Can promote to RAC or directly to Confirmed based on availability
    const availableSeats = 5; // This would come from actual seat availability check

    if (availableSeats > 0) {
      // Promote to Confirmed
      booking.setState(new ConfirmedState());
      booking.passengers.forEach(p => {
        p.status = BookingStatus.CONFIRMED;
        p.waitlistPosition = null;
      });
      console.log(`Booking ${booking.pnr} promoted from WAITLIST to CONFIRMED!`);
    } else {
      // Promote to RAC
      const racPosition = this.waitlistPosition; // Simplified logic
      booking.setState(new RACState(racPosition));
      booking.passengers.forEach(p => p.setRAC(racPosition));
      console.log(`Booking ${booking.pnr} promoted from WAITLIST to RAC!`);
    }
  }

  getStatus(): BookingStatus {
    return BookingStatus.WAITLIST;
  }

  getStateName(): string {
    return `Waitlist (Position: ${this.waitlistPosition})`;
  }

  getWaitlistPosition(): number {
    return this.waitlistPosition;
  }

  setWaitlistPosition(position: number): void {
    this.waitlistPosition = position;
  }
}
