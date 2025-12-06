import { IRecurrenceStrategy } from './IRecurrenceStrategy';
import { DayOfWeek } from '../enums/DayOfWeek';

export class WeeklyRecurrenceStrategy implements IRecurrenceStrategy {
  private daysOfWeek: DayOfWeek[];

  constructor(daysOfWeek: DayOfWeek[] = []) {
    this.daysOfWeek = daysOfWeek.length > 0 ? daysOfWeek : [new Date().getDay()];
  }

  public generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (this.daysOfWeek.includes(currentDate.getDay())) {
        occurrences.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 0 && interval > 1) {
        currentDate.setDate(currentDate.getDate() + (interval - 1) * 7);
      }
    }

    return occurrences;
  }

  public getNextOccurrence(fromDate: Date, interval: number): Date {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + (interval * 7));
    return nextDate;
  }
}
