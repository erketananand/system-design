import { Event } from '../models/Event';
import { RecurrenceRule } from '../models/RecurrenceRule';
import { IdGenerator } from '../utils/IdGenerator';
import { Logger } from '../utils/Logger';

export class EventFactory {
  public static createSingleEvent(
    title: string,
    organizerId: string,
    startTime: Date,
    endTime: Date,
    description: string = '',
    location: string = ''
  ): Event {
    const event = new Event(title, organizerId, startTime, endTime, description, location);
    Logger.info(`Single event created: ${event.id}`);
    return event;
  }

  public static createRecurringEvent(
    title: string,
    organizerId: string,
    startTime: Date,
    endTime: Date,
    rule: RecurrenceRule,
    description: string = '',
    location: string = ''
  ): Event {
    const event = new Event(title, organizerId, startTime, endTime, description, location);
    event.setRecurrence(rule);
    Logger.info(`Recurring event created: ${event.id} with pattern ${rule.pattern}`);
    return event;
  }

  public static createEventInstance(parentEvent: Event, occurrenceDate: Date): Event {
    if (!parentEvent.isRecurring) {
      throw new Error('Cannot create instance from non-recurring event');
    }

    const duration = parentEvent.getDuration();
    const instanceStartTime = new Date(occurrenceDate);
    const instanceEndTime = new Date(instanceStartTime.getTime() + duration);

    const instance = new Event(
      parentEvent.title,
      parentEvent.organizerId,
      instanceStartTime,
      instanceEndTime,
      parentEvent.description,
      parentEvent.location
    );

    instance.parentEventId = parentEvent.id;
    instance.participantIds = [...parentEvent.participantIds];
    instance.roomId = parentEvent.roomId;

    Logger.info(`Event instance created: ${instance.id} from parent ${parentEvent.id}`);
    return instance;
  }
}
