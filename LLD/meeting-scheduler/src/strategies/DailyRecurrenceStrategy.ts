import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export class DailyRecurrenceStrategy implements IRecurrenceStrategy {
  public generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      occurrences.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + interval);
    }

    return occurrences;
  }

  public getNextOccurrence(fromDate: Date, interval: number): Date {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  }
}
