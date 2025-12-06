import { RecurrenceRule } from '../models/RecurrenceRule';
import { Event } from '../models/Event';
import { RecurrencePattern } from '../enums/RecurrencePattern';
import { IRecurrenceStrategy } from '../strategies/IRecurrenceStrategy';
import { DailyRecurrenceStrategy } from '../strategies/DailyRecurrenceStrategy';
import { WeeklyRecurrenceStrategy } from '../strategies/WeeklyRecurrenceStrategy';
import { MonthlyRecurrenceStrategy } from '../strategies/MonthlyRecurrenceStrategy';
import { EventFactory } from '../factories/EventFactory';
import { Logger } from '../utils/Logger';

export class RecurrenceService {
  private strategyMap: Map<RecurrencePattern, IRecurrenceStrategy>;

  constructor() {
    this.strategyMap = new Map();
    this.strategyMap.set(RecurrencePattern.DAILY, new DailyRecurrenceStrategy());
    this.strategyMap.set(RecurrencePattern.WEEKLY, new WeeklyRecurrenceStrategy());
    this.strategyMap.set(RecurrencePattern.MONTHLY, new MonthlyRecurrenceStrategy());
  }

  public setStrategy(pattern: RecurrencePattern, strategy: IRecurrenceStrategy): void {
    this.strategyMap.set(pattern, strategy);
  }

  public generateOccurrences(rule: RecurrenceRule, startDate: Date, endDate: Date): Date[] {
    const strategy = this.strategyMap.get(rule.pattern);
    if (!strategy) {
      throw new Error(`No strategy found for pattern: ${rule.pattern}`);
    }

    let occurrences = strategy.generateOccurrences(startDate, endDate, rule.interval);

    // Filter out exceptions
    occurrences = occurrences.filter(date => rule.isValidOccurrence(date));

    // Limit by occurrence count if specified
    if (rule.occurrenceCount !== null) {
      occurrences = occurrences.slice(0, rule.occurrenceCount);
    }

    // Limit by end date if specified
    if (rule.endDate !== null) {
      occurrences = occurrences.filter(date => date <= rule.endDate!);
    }

    return occurrences;
  }

  public createRecurringEvents(baseEvent: Event, rule: RecurrenceRule, endDate: Date): Event[] {
    if (!baseEvent.isRecurring) {
      throw new Error('Base event must be marked as recurring');
    }

    const occurrences = this.generateOccurrences(rule, baseEvent.startTime, endDate);
    const events: Event[] = [];

    for (const occurrenceDate of occurrences) {
      // Skip the first occurrence as it's the base event
      if (occurrenceDate.getTime() === baseEvent.startTime.getTime()) {
        continue;
      }

      const instance = EventFactory.createEventInstance(baseEvent, occurrenceDate);
      events.push(instance);
    }

    Logger.info(`Generated ${events.length} recurring event instances`);
    return events;
  }

  public getNextOccurrence(rule: RecurrenceRule, fromDate: Date): Date | null {
    const strategy = this.strategyMap.get(rule.pattern);
    if (!strategy) {
      throw new Error(`No strategy found for pattern: ${rule.pattern}`);
    }

    let nextDate = strategy.getNextOccurrence(fromDate, rule.interval);

    // Check if next date exceeds end conditions
    if (rule.endDate !== null && nextDate > rule.endDate) {
      return null;
    }

    // Validate against exceptions
    while (!rule.isValidOccurrence(nextDate)) {
      nextDate = strategy.getNextOccurrence(nextDate, rule.interval);
      if (rule.endDate !== null && nextDate > rule.endDate) {
        return null;
      }
    }

    return nextDate;
  }

  public expandRecurringEvent(event: Event, startDate: Date, endDate: Date): Event[] {
    if (!event.isRecurring || !event.recurrenceRule) {
      return [event];
    }

    const occurrences = this.generateOccurrences(event.recurrenceRule, startDate, endDate);
    const events: Event[] = [];

    for (const occurrenceDate of occurrences) {
      const instance = EventFactory.createEventInstance(event, occurrenceDate);
      events.push(instance);
    }

    return events;
  }
}
