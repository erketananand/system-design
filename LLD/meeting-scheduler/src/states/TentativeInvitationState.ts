import { IInvitationState } from './IInvitationState';
import { Invitation } from '../models/Invitation';
import { InvitationStatus } from '../enums/InvitationStatus';
import { Logger } from '../utils/Logger';

export class TentativeInvitationState implements IInvitationState {
  public accept(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.ACCEPTED);
    Logger.success(`Invitation ${invitation.id} changed from TENTATIVE to ACCEPTED`);
  }

  public decline(invitation: Invitation): void {
    invitation.updateStatus(InvitationStatus.DECLINED);
    Logger.info(`Invitation ${invitation.id} changed from TENTATIVE to DECLINED`);
  }

  public tentative(invitation: Invitation): void {
    Logger.warn('Invitation already marked as tentative');
  }

  public getStatusName(): InvitationStatus {
    return InvitationStatus.TENTATIVE;
  }
}
