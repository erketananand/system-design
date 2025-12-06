export interface IRecurrenceStrategy {
  generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[];
  getNextOccurrence(fromDate: Date, interval: number): Date;
}
