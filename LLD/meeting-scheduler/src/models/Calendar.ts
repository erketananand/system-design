import { IdGenerator } from '../utils/IdGenerator';

export class Calendar {
  public readonly id: string;
  public userId: string;
  public events: string[];

  constructor(userId: string, id?: string) {
    this.id = id || IdGenerator.generateCalendarId();
    this.userId = userId;
    this.events = [];
  }

  public addEvent(eventId: string): void {
    if (!this.events.includes(eventId)) {
      this.events.push(eventId);
    }
  }

  public removeEvent(eventId: string): void {
    this.events = this.events.filter(id => id !== eventId);
  }

  public hasEvent(eventId: string): boolean {
    return this.events.includes(eventId);
  }

  public getEventCount(): number {
    return this.events.length;
  }

  public getInfo(): string {
    return `Calendar for User ${this.userId} - ${this.events.length} events`;
  }
}
