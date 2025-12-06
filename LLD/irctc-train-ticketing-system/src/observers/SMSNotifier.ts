import { IBookingObserver } from './IBookingObserver';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

export class SMSNotifier implements IBookingObserver {
  onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void {
    console.log(`\n📱 SMS NOTIFICATION:`);
    console.log(`   PNR ${booking.pnr}: Status updated to ${newStatus}`);
    console.log(`   SMS sent to user ID: ${booking.userId}`);
  }

  onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void {
    console.log(`\n📱 SMS NOTIFICATION:`);
    console.log(`   🎊 PNR ${booking.pnr} promoted to ${newStatus}!`);
    console.log(`   Check your ticket details.`);
    console.log(`   SMS sent to user ID: ${booking.userId}`);
  }

  onBookingCancelled(booking: Booking, refundAmount: number): void {
    console.log(`\n📱 SMS NOTIFICATION:`);
    console.log(`   PNR ${booking.pnr} cancelled. Refund: ₹${refundAmount}`);
    console.log(`   SMS sent to user ID: ${booking.userId}`);
  }

  getObserverName(): string {
    return 'SMSNotifier';
  }
}
