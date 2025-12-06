import { IInvitationObserver } from './IInvitationObserver';
import { Invitation } from '../models/Invitation';
import { Logger } from '../utils/Logger';

export class EmailNotificationObserver implements IInvitationObserver {
  public update(invitation: Invitation): void {
    Logger.info(`[EMAIL] Sending email notification for invitation ${invitation.id}`);
    Logger.info(`  → User: ${invitation.userId}, Event: ${invitation.eventId}, Status: ${invitation.status}`);
    this.sendEmail(invitation);
  }

  private sendEmail(invitation: Invitation): void {
    console.log(`📧 Email sent to user ${invitation.userId} about event ${invitation.eventId}`);
  }
}
