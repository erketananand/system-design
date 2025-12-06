import { IInvitationState } from './IInvitationState';
import { Invitation } from '../models/Invitation';
import { InvitationStatus } from '../enums/InvitationStatus';
import { Logger } from '../utils/Logger';

export class AcceptedInvitationState implements IInvitationState {
  public accept(invitation: Invitation): void {
    Logger.warn('Invitation already accepted');
  }

  public decline(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.DECLINED);
    Logger.info(`Invitation ${invitation.id} changed from ACCEPTED to DECLINED`);
  }

  public tentative(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.TENTATIVE);
    Logger.info(`Invitation ${invitation.id} changed from ACCEPTED to TENTATIVE`);
  }

  public getStatusName(): InvitationStatus {
    return InvitationStatus.ACCEPTED;
  }
}
