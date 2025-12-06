import { Event } from '../models/Event';
import { RecurrenceRule } from '../models/RecurrenceRule';
import { EventRepository } from '../repositories/EventRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { EventFactory } from '../factories/EventFactory';
import { EventStatus } from '../enums/EventStatus';
import { Logger } from '../utils/Logger';

export class EventService {
  private eventRepo = new EventRepository();
  private calendarRepo = new CalendarRepository();

  public createEvent(
    title: string,
    organizerId: string,
    startTime: Date,
    endTime: Date,
    description: string = '',
    location: string = ''
  ): Event {
    const event = EventFactory.createSingleEvent(title, organizerId, startTime, endTime, description, location);
    this.eventRepo.save(event);

    // Add to organizer's calendar
    const calendar = this.calendarRepo.findByUser(organizerId);
    if (calendar) {
      calendar.addEvent(event.id);
      this.calendarRepo.save(calendar);
    }

    Logger.success(`Event created: ${event.title} (${event.id})`);
    return event;
  }

  public createRecurringEvent(
    title: string,
    organizerId: string,
    startTime: Date,
    endTime: Date,
    rule: RecurrenceRule,
    description: string = '',
    location: string = ''
  ): Event {
    const event = EventFactory.createRecurringEvent(title, organizerId, startTime, endTime, rule, description, location);
    this.eventRepo.save(event);

    const calendar = this.calendarRepo.findByUser(organizerId);
    if (calendar) {
      calendar.addEvent(event.id);
      this.calendarRepo.save(calendar);
    }

    Logger.success(`Recurring event created: ${event.title} (${event.id})`);
    return event;
  }

  public getEventById(id: string): Event {
    const event = this.eventRepo.findById(id);
    if (!event) {
      throw new Error(`Event not found: ${id}`);
    }
    return event;
  }

  public updateEvent(eventId: string, updates: Partial<Event>): Event {
    const event = this.getEventById(eventId);
    event.updateDetails(updates);
    this.eventRepo.save(event);
    Logger.info(`Event updated: ${event.title}`);
    return event;
  }

  public cancelEvent(eventId: string): void {
    const event = this.getEventById(eventId);
    event.cancel();
    this.eventRepo.save(event);
    Logger.warn(`Event cancelled: ${event.title}`);
  }

  public getEventsForUser(userId: string): Event[] {
    return this.eventRepo.findByParticipant(userId);
  }

  public getEventsByOrganizer(organizerId: string): Event[] {
    return this.eventRepo.findByOrganizer(organizerId);
  }

  public getUpcomingEvents(): Event[] {
    return this.eventRepo.findUpcoming();
  }

  public addParticipantToEvent(eventId: string, userId: string): void {
    const event = this.getEventById(eventId);
    event.addParticipant(userId);
    this.eventRepo.save(event);

    // Add to participant's calendar
    const calendar = this.calendarRepo.findByUser(userId);
    if (calendar) {
      calendar.addEvent(eventId);
      this.calendarRepo.save(calendar);
    }

    Logger.info(`Participant ${userId} added to event ${event.title}`);
  }

  public removeParticipantFromEvent(eventId: string, userId: string): void {
    const event = this.getEventById(eventId);
    event.removeParticipant(userId);
    this.eventRepo.save(event);

    const calendar = this.calendarRepo.findByUser(userId);
    if (calendar) {
      calendar.removeEvent(eventId);
      this.calendarRepo.save(calendar);
    }

    Logger.info(`Participant ${userId} removed from event ${event.title}`);
  }
}
