import { Event } from '../models/Event';
import { TimeSlot } from '../models/TimeSlot';
import { EventRepository } from '../repositories/EventRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { EventStatus } from '../enums/EventStatus';
import { Logger } from '../utils/Logger';

export class ConflictDetector {
  private eventRepo = new EventRepository();
  private calendarRepo = new CalendarRepository();

  public detectUserConflicts(userId: string, startTime: Date, endTime: Date, excludeEventId?: string): Event[] {
    const userEvents = this.eventRepo.findByParticipant(userId);
    const conflicts: Event[] = [];

    for (const event of userEvents) {
      if (event.status === EventStatus.CANCELLED) continue;
      if (excludeEventId && event.id === excludeEventId) continue;

      if (this.hasTimeOverlap(startTime, endTime, event.startTime, event.endTime)) {
        conflicts.push(event);
      }
    }

    return conflicts;
  }

  public detectRoomConflicts(roomId: string, startTime: Date, endTime: Date, excludeEventId?: string): Event[] {
    const roomEvents = this.eventRepo.findByRoom(roomId);
    const conflicts: Event[] = [];

    for (const event of roomEvents) {
      if (event.status === EventStatus.CANCELLED) continue;
      if (excludeEventId && event.id === excludeEventId) continue;

      if (this.hasTimeOverlap(startTime, endTime, event.startTime, event.endTime)) {
        conflicts.push(event);
      }
    }

    return conflicts;
  }

  public hasConflict(event: Event): boolean {
    // Check organizer conflicts
    const organizerConflicts = this.detectUserConflicts(
      event.organizerId,
      event.startTime,
      event.endTime,
      event.id
    );

    if (organizerConflicts.length > 0) {
      return true;
    }

    // Check participant conflicts
    for (const participantId of event.participantIds) {
      const conflicts = this.detectUserConflicts(
        participantId,
        event.startTime,
        event.endTime,
        event.id
      );
      if (conflicts.length > 0) {
        return true;
      }
    }

    // Check room conflicts
    if (event.roomId) {
      const roomConflicts = this.detectRoomConflicts(
        event.roomId,
        event.startTime,
        event.endTime,
        event.id
      );
      if (roomConflicts.length > 0) {
        return true;
      }
    }

    return false;
  }

  public suggestAlternativeSlots(
    participants: string[],
    duration: number,
    preferredDate: Date,
    numSlots: number = 3
  ): TimeSlot[] {
    const suggestions: TimeSlot[] = [];
    const startOfDay = new Date(preferredDate);
    startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM

    const endOfDay = new Date(preferredDate);
    endOfDay.setHours(18, 0, 0, 0); // End at 6 PM

    let currentTime = new Date(startOfDay);

    while (suggestions.length < numSlots && currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + duration);

      if (slotEnd > endOfDay) break;

      // Check if all participants are available
      let allAvailable = true;
      const availableParticipants: string[] = [];

      for (const participantId of participants) {
        const conflicts = this.detectUserConflicts(participantId, currentTime, slotEnd);
        if (conflicts.length === 0) {
          availableParticipants.push(participantId);
        } else {
          allAvailable = false;
        }
      }

      if (allAvailable) {
        suggestions.push(new TimeSlot(new Date(currentTime), new Date(slotEnd), availableParticipants));
      }

      // Move to next 30-minute slot
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    Logger.info(`Found ${suggestions.length} alternative time slots`);
    return suggestions;
  }

  private hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  public getConflictSummary(event: Event): string {
    const conflicts = [];

    const organizerConflicts = this.detectUserConflicts(event.organizerId, event.startTime, event.endTime, event.id);
    if (organizerConflicts.length > 0) {
      conflicts.push(`Organizer has ${organizerConflicts.length} conflicts`);
    }

    for (const participantId of event.participantIds) {
      const participantConflicts = this.detectUserConflicts(participantId, event.startTime, event.endTime, event.id);
      if (participantConflicts.length > 0) {
        conflicts.push(`Participant ${participantId} has ${participantConflicts.length} conflicts`);
      }
    }

    if (event.roomId) {
      const roomConflicts = this.detectRoomConflicts(event.roomId, event.startTime, event.endTime, event.id);
      if (roomConflicts.length > 0) {
        conflicts.push(`Room has ${roomConflicts.length} conflicts`);
      }
    }

    return conflicts.length > 0 ? conflicts.join(', ') : 'No conflicts';
  }
}
