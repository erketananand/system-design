import { IInvitationObserver } from './IInvitationObserver';
import { Invitation } from '../models/Invitation';
import { Logger } from '../utils/Logger';

export class ReminderObserver implements IInvitationObserver {
  private reminderMinutes: number;

  constructor(reminderMinutes: number = 15) {
    this.reminderMinutes = reminderMinutes;
  }

  public update(invitation: Invitation): void {
    if (invitation.isAccepted()) {
      Logger.info(`[REMINDER] Scheduling reminder ${this.reminderMinutes} min before event ${invitation.eventId}`);
      this.scheduleReminder(invitation);
    }
  }

  private scheduleReminder(invitation: Invitation): void {
    console.log(`⏰ Reminder scheduled ${this.reminderMinutes} min before event ${invitation.eventId}`);
  }
}
