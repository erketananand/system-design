import { IdGenerator } from '../utils/IdGenerator';
import { InvitationStatus } from '../enums/InvitationStatus';

export class Invitation {
  public readonly id: string;
  public eventId: string;
  public userId: string;
  public status: InvitationStatus;
  public readonly sentAt: Date;
  public respondedAt: Date | null;

  constructor(eventId: string, userId: string, id?: string) {
    this.id = id || IdGenerator.generateInvitationId();
    this.eventId = eventId;
    this.userId = userId;
    this.status = InvitationStatus.PENDING;
    this.sentAt = new Date();
    this.respondedAt = null;
  }

  public accept(): void {
    this.updateStatus(InvitationStatus.ACCEPTED);
  }

  public decline(): void {
    this.updateStatus(InvitationStatus.DECLINED);
  }

  public tentative(): void {
    this.updateStatus(InvitationStatus.TENTATIVE);
  }

  public updateStatus(status: InvitationStatus): void {
    this.status = status;
    if (status !== InvitationStatus.PENDING) {
      this.respondedAt = new Date();
    }
  }

  public isPending(): boolean {
    return this.status === InvitationStatus.PENDING;
  }

  public isAccepted(): boolean {
    return this.status === InvitationStatus.ACCEPTED;
  }

  public isDeclined(): boolean {
    return this.status === InvitationStatus.DECLINED;
  }

  public isTentative(): boolean {
    return this.status === InvitationStatus.TENTATIVE;
  }

  public getInfo(): string {
    return `Invitation for Event ${this.eventId} - Status: ${this.status}`;
  }
}
