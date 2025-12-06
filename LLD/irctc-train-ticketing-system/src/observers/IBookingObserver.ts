import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

/**
 * Observer Pattern Interface for Booking Notifications
 */
export interface IBookingObserver {
  /**
   * Notify when booking status changes
   */
  onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void;

  /**
   * Notify when booking is promoted from waitlist
   */
  onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void;

  /**
   * Notify when booking is cancelled
   */
  onBookingCancelled(booking: Booking, refundAmount: number): void;

  /**
   * Get observer name
   */
  getObserverName(): string;
}
