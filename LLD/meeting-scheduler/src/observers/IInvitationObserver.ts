import { Invitation } from '../models/Invitation';

export interface IInvitationObserver {
  update(invitation: Invitation): void;
}
