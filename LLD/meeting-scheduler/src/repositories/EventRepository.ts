import { IRepository } from './IRepository';
import { Event } from '../models/Event';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { EventStatus } from '../enums/EventStatus';

export class EventRepository implements IRepository<Event> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Event | undefined {
    return this.db.events.get(id);
  }

  public findAll(): Event[] {
    return Array.from(this.db.events.values());
  }

  public save(event: Event): Event {
    this.db.events.set(event.id, event);
    return event;
  }

  public delete(id: string): boolean {
    return this.db.events.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.events.has(id);
  }

  public count(): number {
    return this.db.events.size;
  }

  public clear(): void {
    this.db.events.clear();
  }

  // Custom query methods
  public findByOrganizer(organizerId: string): Event[] {
    return Array.from(this.db.events.values()).filter(e => e.organizerId === organizerId);
  }

  public findByParticipant(userId: string): Event[] {
    return Array.from(this.db.events.values()).filter(e => e.participantIds.includes(userId));
  }

  public findByDateRange(startDate: Date, endDate: Date): Event[] {
    return Array.from(this.db.events.values()).filter(e => 
      e.startTime >= startDate && e.endTime <= endDate
    );
  }

  public findByRoom(roomId: string): Event[] {
    return Array.from(this.db.events.values()).filter(e => e.roomId === roomId);
  }

  public findRecurringEvents(): Event[] {
    return Array.from(this.db.events.values()).filter(e => e.isRecurring);
  }

  public findByStatus(status: EventStatus): Event[] {
    return Array.from(this.db.events.values()).filter(e => e.status === status);
  }

  public findUpcoming(fromDate: Date = new Date()): Event[] {
    return Array.from(this.db.events.values())
      .filter(e => e.startTime > fromDate && e.status === EventStatus.SCHEDULED)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
}
