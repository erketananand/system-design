import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

/**
 * State Pattern Interface for Booking States
 */
export interface IBookingState {
  /**
   * Confirm the booking
   */
  confirm(booking: Booking): void;

  /**
   * Cancel the booking
   */
  cancel(booking: Booking): void;

  /**
   * Add booking to waitlist
   */
  addToWaitlist(booking: Booking, position: number): void;

  /**
   * Promote booking from waitlist
   */
  promoteFromWaitlist(booking: Booking): void;

  /**
   * Get current status
   */
  getStatus(): BookingStatus;

  /**
   * Get state name
   */
  getStateName(): string;
}
