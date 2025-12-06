import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export class MonthlyRecurrenceStrategy implements IRecurrenceStrategy {
  public generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    const dayOfMonth = startDate.getDate();

    while (currentDate <= endDate) {
      occurrences.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + interval);
      if (currentDate.getDate() !== dayOfMonth) {
        currentDate.setDate(0);
      }
    }

    return occurrences;
  }

  public getNextOccurrence(fromDate: Date, interval: number): Date {
    const nextDate = new Date(fromDate);
    const dayOfMonth = fromDate.getDate();
    nextDate.setMonth(nextDate.getMonth() + interval);
    if (nextDate.getDate() !== dayOfMonth) {
      nextDate.setDate(0);
    }
    return nextDate;
  }
}
