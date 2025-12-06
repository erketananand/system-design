import { IInvitationState } from './IInvitationState';
import { Invitation } from '../models/Invitation';
import { InvitationStatus } from '../enums/InvitationStatus';
import { Logger } from '../utils/Logger';

export class PendingInvitationState implements IInvitationState {
  public accept(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.ACCEPTED);
    Logger.success(`Invitation ${invitation.id} accepted`);
  }

  public decline(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.DECLINED);
    Logger.info(`Invitation ${invitation.id} declined`);
  }

  public tentative(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.TENTATIVE);
    Logger.info(`Invitation ${invitation.id} marked as tentative`);
  }

  public getStatusName(): InvitationStatus {
    return InvitationStatus.PENDING;
  }
}
