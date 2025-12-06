import { IRepository } from './IRepository';
import { Booking } from '../models/Booking';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { BookingStatus } from '../enums/BookingStatus';

export class BookingRepository implements IRepository<Booking> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): Booking | undefined {
    return this.db.bookings.get(id);
  }

  findAll(): Booking[] {
    return Array.from(this.db.bookings.values());
  }

  save(booking: Booking): Booking {
    this.db.addBooking(booking);
    return booking;
  }

  update(booking: Booking): Booking {
    this.db.bookings.set(booking.id, booking);
    this.db.updateBookingIndexes(booking);
    return booking;
  }

  delete(id: string): boolean {
    this.db.removeBooking(id);
    return true;
  }

  exists(id: string): boolean {
    return this.db.bookings.has(id);
  }

  count(): number {
    return this.db.bookings.size;
  }

  clear(): void {
    this.db.bookings.clear();
  }

  // Custom query methods

  findByPNR(pnr: string): Booking | undefined {
    return this.db.bookingsByPNR.get(pnr);
  }

  existsByPNR(pnr: string): boolean {
    return this.db.bookingsByPNR.has(pnr);
  }

  findByUserId(userId: string): Booking[] {
    return this.db.bookingsByUserId.get(userId) || [];
  }

  findByTrainAndDate(trainId: string, journeyDate: Date): Booking[] {
    return this.db.getTrainBookings(trainId, journeyDate);
  }

  findByStatus(status: BookingStatus): Booking[] {
    return this.findAll().filter(b => b.getStatus() === status);
  }

  findConfirmedBookings(): Booking[] {
    return this.findByStatus(BookingStatus.CONFIRMED);
  }

  findWaitlistedBookings(): Booking[] {
    return this.findByStatus(BookingStatus.WAITLIST);
  }

  findRACBookings(): Booking[] {
    return this.findByStatus(BookingStatus.RAC);
  }

  getBookingCountForTrain(trainId: string, journeyDate: Date): number {
    return this.db.getTrainBookingCount(trainId, journeyDate);
  }

  findUpcomingBookings(userId: string): Booking[] {
    const now = new Date();
    return this.findByUserId(userId).filter(b => 
      b.journeyDate >= now && b.getStatus() !== BookingStatus.CANCELLED
    );
  }

  findPastBookings(userId: string): Booking[] {
    const now = new Date();
    return this.findByUserId(userId).filter(b => b.journeyDate < now);
  }
}
