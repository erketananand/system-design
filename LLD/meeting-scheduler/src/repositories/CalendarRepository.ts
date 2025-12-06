import { IRepository } from './IRepository';
import { Calendar } from '../models/Calendar';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class CalendarRepository implements IRepository<Calendar> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Calendar | undefined {
    return this.db.calendars.get(id);
  }

  public findAll(): Calendar[] {
    return Array.from(this.db.calendars.values());
  }

  public save(calendar: Calendar): Calendar {
    this.db.calendars.set(calendar.id, calendar);
    return calendar;
  }

  public delete(id: string): boolean {
    return this.db.calendars.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.calendars.has(id);
  }

  public count(): number {
    return this.db.calendars.size;
  }

  public clear(): void {
    this.db.calendars.clear();
  }

  // Custom query methods
  public findByUser(userId: string): Calendar | undefined {
    return Array.from(this.db.calendars.values()).find(c => c.userId === userId);
  }

  public findCalendarsWithEvent(eventId: string): Calendar[] {
    return Array.from(this.db.calendars.values()).filter(c => c.events.includes(eventId));
  }
}
