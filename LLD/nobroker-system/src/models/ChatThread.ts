import { IdGenerator } from '../utils/IdGenerator';

export class ChatThread {
  public readonly id: string;
  public listingId: string;
  public ownerId: string;
  public seekerId: string;
  public active: boolean;
  public lastActivityAt: Date;
  public readonly createdAt: Date;

  constructor(
    listingId: string,
    ownerId: string,
    seekerId: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateChatThreadId();
    this.listingId = listingId;
    this.ownerId = ownerId;
    this.seekerId = seekerId;
    this.active = true;
    this.lastActivityAt = new Date();
    this.createdAt = new Date();
  }

  public updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  public closeThread(): void {
    this.active = false;
    this.updateActivity();
  }

  public reopenThread(): void {
    this.active = true;
    this.updateActivity();
  }

  public isParticipant(userId: string): boolean {
    return this.ownerId === userId || this.seekerId === userId;
  }
}
