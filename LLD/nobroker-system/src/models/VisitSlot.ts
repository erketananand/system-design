import { IdGenerator } from '../utils/IdGenerator';
import { VisitStatus } from '../enums/VisitStatus';

export class VisitSlot {
  public readonly id: string;
  public threadId: string;
  public proposedById: string;
  public proposedFor: Date;
  public status: VisitStatus;
  public respondedById: string | null;
  public respondedAt: Date | null;
  public readonly createdAt: Date;

  constructor(
    threadId: string,
    proposedById: string,
    proposedFor: Date,
    id?: string
  ) {
    this.id = id || IdGenerator.generateVisitId();
    this.threadId = threadId;
    this.proposedById = proposedById;
    this.proposedFor = proposedFor;
    this.status = VisitStatus.PROPOSED;
    this.respondedById = null;
    this.respondedAt = null;
    this.createdAt = new Date();
  }

  public accept(userId: string): void {
    if (this.status === VisitStatus.PROPOSED) {
      this.status = VisitStatus.ACCEPTED;
      this.respondedById = userId;
      this.respondedAt = new Date();
    }
  }

  public reject(userId: string): void {
    if (this.status === VisitStatus.PROPOSED) {
      this.status = VisitStatus.REJECTED;
      this.respondedById = userId;
      this.respondedAt = new Date();
    }
  }

  public cancel(userId: string): void {
    if (this.status === VisitStatus.PROPOSED || this.status === VisitStatus.ACCEPTED) {
      this.status = VisitStatus.CANCELLED;
      this.respondedById = userId;
      this.respondedAt = new Date();
    }
  }

  public isProposed(): boolean {
    return this.status === VisitStatus.PROPOSED;
  }

  public isAccepted(): boolean {
    return this.status === VisitStatus.ACCEPTED;
  }

  public isRejected(): boolean {
    return this.status === VisitStatus.REJECTED;
  }

  public isCancelled(): boolean {
    return this.status === VisitStatus.CANCELLED;
  }
}
