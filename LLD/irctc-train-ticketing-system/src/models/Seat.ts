import { IdGenerator } from '../utils/IdGenerator';
import { BerthType } from '../enums/BerthType';
import { SeatLockManager } from '../utils/SeatLockManager';

export class Seat {
  public readonly id: string;
  public seatNumber: string;
  public berthType: BerthType;
  public coachId: string;
  public bookings: Map<string, string>; // date -> bookingId
  private lockManager = SeatLockManager.getInstance();

  constructor(
    seatNumber: string,
    berthType: BerthType,
    coachId: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.seatNumber = seatNumber;
    this.berthType = berthType;
    this.coachId = coachId;
    this.bookings = new Map<string, string>();
  }

  /**
   * Try to lock seat for booking (prevents concurrent booking)
   */
  public tryLock(date: string, bookingId: string): boolean {
    // Check if already booked
    if (this.bookings.has(date)) {
      return false;
    }

    // Try to acquire lock
    return this.lockManager.tryLock(this.id, date, bookingId);
  }

  /**
   * Book this seat for a specific date (after lock is acquired)
   */
  public book(date: string, bookingId: string): boolean {
    if (this.bookings.has(date)) {
      return false; // Already booked
    }

    // Verify lock is held by this booking
    const lockInfo = this.lockManager.getLockInfo(this.id, date);
    if (!lockInfo || lockInfo.bookingId !== bookingId) {
      console.log(`[SEAT] Cannot book: lock not held by booking ${bookingId}`);
      return false;
    }

    // Book the seat
    this.bookings.set(date, bookingId);
    
    // Release the lock after successful booking
    this.lockManager.releaseLock(this.id, date, bookingId);
    
    return true;
  }

  /**
   * Release lock on seat (if booking fails)
   */
  public releaseLock(date: string, bookingId: string): boolean {
    return this.lockManager.releaseLock(this.id, date, bookingId);
  }

  /**
   * Release this seat for a specific date
   */
  public release(date: string): void {
    this.bookings.delete(date);
  }

  /**
   * Check if seat is available on a specific date
   * Returns false if either booked or locked
   */
  public isAvailableOn(date: Date): boolean {
    const dateKey = this.getDateKey(date);
    
    // Check if already booked
    if (this.bookings.has(dateKey)) {
      return false;
    }

    // Check if locked by another booking
    if (this.lockManager.isLocked(this.id, dateKey)) {
      return false;
    }

    return true;
  }

  /**
   * Get booking ID for a specific date
   */
  public getBookingIdForDate(date: string): string | null {
    return this.bookings.get(date) || null;
  }

  /**
   * Convert date to string key
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get seat display info
   */
  public getDisplayInfo(): string {
    return `${this.seatNumber} (${this.berthType})`;
  }
}
