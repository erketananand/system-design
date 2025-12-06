import { IInvitationState } from './IInvitationState';
import { Invitation } from '../models/Invitation';
import { InvitationStatus } from '../enums/InvitationStatus';
import { Logger } from '../utils/Logger';

export class DeclinedInvitationState implements IInvitationState {
  public accept(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.ACCEPTED);
    Logger.success(`Invitation ${invitation.id} changed from DECLINED to ACCEPTED`);
  }

  public decline(invitation: Invitation): void {
    Logger.warn('Invitation already declined');
  }

  public tentative(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.TENTATIVE);
    Logger.info(`Invitation ${invitation.id} changed from DECLINED to TENTATIVE`);
  }

  public getStatusName(): InvitationStatus {
    return InvitationStatus.DECLINED;
  }
}
