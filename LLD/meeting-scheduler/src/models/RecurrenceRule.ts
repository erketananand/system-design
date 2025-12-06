import { IdGenerator } from '../utils/IdGenerator';
import { RecurrencePattern } from '../enums/RecurrencePattern';
import { DayOfWeek } from '../enums/DayOfWeek';

export class RecurrenceRule {
  public readonly id: string;
  public pattern: RecurrencePattern;
  public interval: number;
  public endDate: Date | null;
  public occurrenceCount: number | null;
  public daysOfWeek: DayOfWeek[];
  public exceptions: Date[];

  constructor(pattern: RecurrencePattern, interval: number = 1, endDate: Date | null = null, occurrenceCount: number | null = null, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.pattern = pattern;
    this.interval = interval;
    this.endDate = endDate;
    this.occurrenceCount = occurrenceCount;
    this.daysOfWeek = [];
    this.exceptions = [];
    if (interval < 1) throw new Error('Interval must be at least 1');
  }

  public addException(date: Date): void {
    const dateString = date.toISOString().split('T')[0];
    const exists = this.exceptions.some(ex => ex.toISOString().split('T')[0] === dateString);
    if (!exists) this.exceptions.push(date);
  }

  public isValidOccurrence(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0];
    return !this.exceptions.some(ex => ex.toISOString().split('T')[0] === dateString);
  }

  public setDaysOfWeek(days: DayOfWeek[]): void {
    if (this.pattern !== RecurrencePattern.WEEKLY) {
      throw new Error('Days of week only for weekly recurrence');
    }
    this.daysOfWeek = days;
  }

  public getInfo(): string {
    return `${this.pattern} every ${this.interval} ${this.pattern.toLowerCase()}`;
  }
}
