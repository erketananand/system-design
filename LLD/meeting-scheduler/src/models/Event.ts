import { IdGenerator } from '../utils/IdGenerator';
import { EventStatus } from '../enums/EventStatus';
import { RecurrenceRule } from './RecurrenceRule';

export class Event {
  public readonly id: string;
  public title: string;
  public description: string;
  public startTime: Date;
  public endTime: Date;
  public location: string;
  public organizerId: string;
  public participantIds: string[];
  public roomId: string | null;
  public recurrenceRule: RecurrenceRule | null;
  public isRecurring: boolean;
  public parentEventId: string | null;
  public status: EventStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(title: string, organizerId: string, startTime: Date, endTime: Date, description: string = '', location: string = '', id?: string) {
    this.id = id || IdGenerator.generateEventId();
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.location = location;
    this.organizerId = organizerId;
    this.participantIds = [organizerId];
    this.roomId = null;
    this.recurrenceRule = null;
    this.isRecurring = false;
    this.parentEventId = null;
    this.status = EventStatus.SCHEDULED;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addParticipant(userId: string): void {
    if (!this.participantIds.includes(userId)) {
      this.participantIds.push(userId);
      this.update();
    }
  }

  public removeParticipant(userId: string): void {
    if (userId === this.organizerId) throw new Error('Cannot remove organizer');
    this.participantIds = this.participantIds.filter(id => id !== userId);
    this.update();
  }

  public assignRoom(roomId: string): void {
    this.roomId = roomId;
    this.update();
  }

  public cancel(): void {
    this.status = EventStatus.CANCELLED;
    this.update();
  }

  public hasConflict(otherEvent: Event): boolean {
    if (this.status === EventStatus.CANCELLED || otherEvent.status === EventStatus.CANCELLED) return false;
    return (this.startTime < otherEvent.endTime && this.endTime > otherEvent.startTime);
  }

  public getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  public setRecurrence(rule: RecurrenceRule): void {
    this.recurrenceRule = rule;
    this.isRecurring = true;
    this.update();
  }

  public updateDetails(updates: Partial<Event>): void {
    if (updates.title !== undefined) this.title = updates.title;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.startTime !== undefined) this.startTime = updates.startTime;
    if (updates.endTime !== undefined) this.endTime = updates.endTime;
    if (updates.location !== undefined) this.location = updates.location;
    if (updates.status !== undefined) this.status = updates.status;
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }

  public getInfo(): string {
    return `${this.title} (${this.startTime.toLocaleString()} - ${this.endTime.toLocaleString()})`;
  }
}
