import { Invitation } from '../models/Invitation';
import { InvitationStatus } from '../enums/InvitationStatus';

export interface IInvitationState {
  accept(invitation: Invitation): void;
  decline(invitation: Invitation): void;
  tentative(invitation: Invitation): void;
  getStatusName(): InvitationStatus;
}
