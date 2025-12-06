import { IBookingObserver } from './IBookingObserver';
import { Booking } from '../models/Booking';
import { BookingStatus } from '../enums/BookingStatus';

/**
 * Subject class for Observer Pattern
 * Manages observers and notifies them of booking events
 */
export class BookingNotifier {
  private static instance: BookingNotifier;
  private observers: IBookingObserver[] = [];

  private constructor() {}

  public static getInstance(): BookingNotifier {
    if (!BookingNotifier.instance) {
      BookingNotifier.instance = new BookingNotifier();
    }
    return BookingNotifier.instance;
  }

  /**
   * Attach an observer
   */
  public attach(observer: IBookingObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      console.log(`Observer ${observer.getObserverName()} attached.`);
    }
  }

  /**
   * Detach an observer
   */
  public detach(observer: IBookingObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`Observer ${observer.getObserverName()} detached.`);
    }
  }

  /**
   * Notify all observers about status change
   */
  public notifyStatusChange(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void {
    for (const observer of this.observers) {
      observer.onBookingStatusChanged(booking, oldStatus, newStatus);
    }
  }

  /**
   * Notify all observers about waitlist promotion
   */
  public notifyWaitlistPromotion(booking: Booking, newStatus: BookingStatus): void {
    for (const observer of this.observers) {
      observer.onWaitlistPromoted(booking, newStatus);
    }
  }

  /**
   * Notify all observers about cancellation
   */
  public notifyCancellation(booking: Booking, refundAmount: number): void {
    for (const observer of this.observers) {
      observer.onBookingCancelled(booking, refundAmount);
    }
  }

  /**
   * Get all attached observers
   */
  public getObservers(): IBookingObserver[] {
    return this.observers;
  }
}
