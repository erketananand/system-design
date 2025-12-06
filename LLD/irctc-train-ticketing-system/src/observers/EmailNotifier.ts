import { IBookingObserver } from './IBookingObserver';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

export class EmailNotifier implements IBookingObserver {
  onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void {
    console.log(`\n📧 EMAIL NOTIFICATION:`);
    console.log(`   PNR: ${booking.pnr}`);
    console.log(`   Status changed: ${oldStatus} → ${newStatus}`);
    console.log(`   Email sent to user ID: ${booking.userId}`);
  }

  onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void {
    console.log(`\n📧 EMAIL NOTIFICATION:`);
    console.log(`   🎉 Great News! Your booking is promoted!`);
    console.log(`   PNR: ${booking.pnr}`);
    console.log(`   New Status: ${newStatus}`);
    console.log(`   Email sent to user ID: ${booking.userId}`);
  }

  onBookingCancelled(booking: Booking, refundAmount: number): void {
    console.log(`\n📧 EMAIL NOTIFICATION:`);
    console.log(`   Booking Cancelled`);
    console.log(`   PNR: ${booking.pnr}`);
    console.log(`   Refund Amount: ₹${refundAmount}`);
    console.log(`   Refund will be processed in 5-7 business days`);
    console.log(`   Email sent to user ID: ${booking.userId}`);
  }

  getObserverName(): string {
    return 'EmailNotifier';
  }
}
