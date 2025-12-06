import { IdGenerator } from '../utils/IdGenerator';

export class RoomBooking {
  public readonly id: string;
  public roomId: string;
  public eventId: string;
  public startTime: Date;
  public endTime: Date;
  public readonly bookedAt: Date;

  constructor(roomId: string, eventId: string, startTime: Date, endTime: Date, id?: string) {
    this.id = id || IdGenerator.generateBookingId();
    this.roomId = roomId;
    this.eventId = eventId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.bookedAt = new Date();
  }

  public isActive(): boolean {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  public hasConflict(other: RoomBooking): boolean {
    return (this.startTime < other.endTime && this.endTime > other.startTime);
  }

  public getInfo(): string {
    return `Room ${this.roomId} booked for Event ${this.eventId} (${this.startTime.toLocaleString()} - ${this.endTime.toLocaleString()})`;
  }
}
