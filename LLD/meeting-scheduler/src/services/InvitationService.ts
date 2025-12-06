import { Invitation } from '../models/Invitation';
import { InvitationRepository } from '../repositories/InvitationRepository';
import { EventRepository } from '../repositories/EventRepository';
import { IInvitationObserver } from '../observers/IInvitationObserver';
import { InvitationStatus } from '../enums/InvitationStatus';
import { Logger } from '../utils/Logger';

export class InvitationService {
  private invitationRepo = new InvitationRepository();
  private eventRepo = new EventRepository();
  private observers: IInvitationObserver[] = [];

  public sendInvitations(eventId: string, userIds: string[]): Invitation[] {
    const event = this.eventRepo.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const invitations: Invitation[] = [];

    for (const userId of userIds) {
      // Check if invitation already exists
      const existing = this.invitationRepo.findByEventAndUser(eventId, userId);
      if (existing) {
        Logger.warn(`Invitation already exists for user ${userId} and event ${eventId}`);
        continue;
      }

      const invitation = new Invitation(eventId, userId);
      this.invitationRepo.save(invitation);
      invitations.push(invitation);

      // Notify observers
      this.notifyObservers(invitation);

      Logger.success(`Invitation sent to user ${userId} for event ${eventId}`);
    }

    return invitations;
  }

  public respondToInvitation(invitationId: string, status: InvitationStatus): void {
    const invitation = this.invitationRepo.findById(invitationId);
    if (!invitation) {
      throw new Error(`Invitation not found: ${invitationId}`);
    }

    invitation.updateStatus(status);
    this.invitationRepo.save(invitation);

    // Notify observers about status change
    this.notifyObservers(invitation);

    Logger.info(`Invitation ${invitationId} status changed to ${status}`);
  }

  public acceptInvitation(invitationId: string): void {
    this.respondToInvitation(invitationId, InvitationStatus.ACCEPTED);
  }

  public declineInvitation(invitationId: string): void {
    this.respondToInvitation(invitationId, InvitationStatus.DECLINED);
  }

  public tentativeInvitation(invitationId: string): void {
    this.respondToInvitation(invitationId, InvitationStatus.TENTATIVE);
  }

  public getInvitationsForUser(userId: string): Invitation[] {
    return this.invitationRepo.findByUser(userId);
  }

  public getPendingInvitations(userId: string): Invitation[] {
    return this.invitationRepo.findPending(userId);
  }

  public getInvitationsForEvent(eventId: string): Invitation[] {
    return this.invitationRepo.findByEvent(eventId);
  }

  // Observer pattern methods
  public attach(observer: IInvitationObserver): void {
    this.observers.push(observer);
  }

  public detach(observer: IInvitationObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  private notifyObservers(invitation: Invitation): void {
    this.observers.forEach(observer => observer.update(invitation));
  }
}
