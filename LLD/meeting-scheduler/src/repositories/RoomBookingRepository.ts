import { IRepository } from './IRepository';
import { RoomBooking } from '../models/RoomBooking';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class RoomBookingRepository implements IRepository<RoomBooking> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): RoomBooking | undefined {
    return this.db.roomBookings.get(id);
  }

  public findAll(): RoomBooking[] {
    return Array.from(this.db.roomBookings.values());
  }

  public save(booking: RoomBooking): RoomBooking {
    this.db.roomBookings.set(booking.id, booking);
    return booking;
  }

  public delete(id: string): boolean {
    return this.db.roomBookings.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.roomBookings.has(id);
  }

  public count(): number {
    return this.db.roomBookings.size;
  }

  public clear(): void {
    this.db.roomBookings.clear();
  }

  // Custom query methods
  public findByRoom(roomId: string): RoomBooking[] {
    return Array.from(this.db.roomBookings.values()).filter(b => b.roomId === roomId);
  }

  public findByEvent(eventId: string): RoomBooking | undefined {
    return Array.from(this.db.roomBookings.values()).find(b => b.eventId === eventId);
  }

  public findByDateRange(roomId: string, startDate: Date, endDate: Date): RoomBooking[] {
    return Array.from(this.db.roomBookings.values())
      .filter(b => 
        b.roomId === roomId &&
        b.startTime < endDate &&
        b.endTime > startDate
      );
  }

  public findActiveBookings(roomId: string): RoomBooking[] {
    return Array.from(this.db.roomBookings.values())
      .filter(b => b.roomId === roomId && b.isActive());
  }
}
