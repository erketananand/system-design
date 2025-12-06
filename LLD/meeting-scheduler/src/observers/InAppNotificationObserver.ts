import { IInvitationObserver } from './IInvitationObserver';
import { Invitation } from '../models/Invitation';
import { Logger } from '../utils/Logger';

export class InAppNotificationObserver implements IInvitationObserver {
  public update(invitation: Invitation): void {
    Logger.info(`[IN-APP] Creating notification for invitation ${invitation.id}`);
    this.createNotification(invitation);
  }

  private createNotification(invitation: Invitation): void {
    console.log(`🔔 In-app notification created for user ${invitation.userId}`);
  }
}
