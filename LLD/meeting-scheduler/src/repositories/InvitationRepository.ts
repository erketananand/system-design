import { IRepository } from './IRepository';
import { Invitation } from '../models/Invitation';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { InvitationStatus } from '../enums/InvitationStatus';

export class InvitationRepository implements IRepository<Invitation> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Invitation | undefined {
    return this.db.invitations.get(id);
  }

  public findAll(): Invitation[] {
    return Array.from(this.db.invitations.values());
  }

  public save(invitation: Invitation): Invitation {
    this.db.invitations.set(invitation.id, invitation);
    return invitation;
  }

  public delete(id: string): boolean {
    return this.db.invitations.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.invitations.has(id);
  }

  public count(): number {
    return this.db.invitations.size;
  }

  public clear(): void {
    this.db.invitations.clear();
  }

  // Custom query methods
  public findByEvent(eventId: string): Invitation[] {
    return Array.from(this.db.invitations.values()).filter(i => i.eventId === eventId);
  }

  public findByUser(userId: string): Invitation[] {
    return Array.from(this.db.invitations.values()).filter(i => i.userId === userId);
  }

  public findByStatus(userId: string, status: InvitationStatus): Invitation[] {
    return Array.from(this.db.invitations.values())
      .filter(i => i.userId === userId && i.status === status);
  }

  public findPending(userId: string): Invitation[] {
    return this.findByStatus(userId, InvitationStatus.PENDING);
  }

  public findByEventAndUser(eventId: string, userId: string): Invitation | undefined {
    return Array.from(this.db.invitations.values())
      .find(i => i.eventId === eventId && i.userId === userId);
  }
}
