import { IdGenerator } from '../utils/IdGenerator';
import { BerthType } from '../enums/BerthType';

export class Seat {
  public readonly id: string;
  public seatNumber: string;
  public berthType: BerthType;
  public coachId: string;
  public bookings: Map<string, string>; // date -> bookingId

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
   * Book this seat for a specific date
   */
  public book(date: string, bookingId: string): boolean {
    if (this.bookings.has(date)) {
      return false; // Already booked
    }
    this.bookings.set(date, bookingId);
    return true;
  }

  /**
   * Release this seat for a specific date
   */
  public release(date: string): void {
    this.bookings.delete(date);
  }

  /**
   * Check if seat is available on a specific date
   */
  public isAvailableOn(date: Date): boolean {
    const dateKey = this.getDateKey(date);
    return !this.bookings.has(dateKey);
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
