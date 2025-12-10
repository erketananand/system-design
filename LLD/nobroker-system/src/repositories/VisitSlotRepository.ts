import { IRepository } from './IRepository';
import { VisitSlot } from '../models/VisitSlot';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { VisitStatus } from '../enums/VisitStatus';

export class VisitSlotRepository implements IRepository<VisitSlot> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): VisitSlot | undefined {
    return this.db.visitSlots.get(id);
  }

  public findAll(): VisitSlot[] {
    return Array.from(this.db.visitSlots.values());
  }

  public save(entity: VisitSlot): VisitSlot {
    this.db.visitSlots.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.visitSlots.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.visitSlots.has(id);
  }

  public count(): number {
    return this.db.visitSlots.size;
  }

  public clear(): void {
    this.db.visitSlots.clear();
  }

  // Custom query methods
  public findByThread(threadId: string): VisitSlot[] {
    return Array.from(this.db.visitSlots.values()).filter(v => v.threadId === threadId);
  }

  public findByStatus(status: VisitStatus): VisitSlot[] {
    return Array.from(this.db.visitSlots.values()).filter(v => v.status === status);
  }

  public findByProposer(proposedById: string): VisitSlot[] {
    return Array.from(this.db.visitSlots.values()).filter(v => v.proposedById === proposedById);
  }

  public findProposedVisits(): VisitSlot[] {
    return this.findByStatus(VisitStatus.PROPOSED);
  }

  public findAcceptedVisits(): VisitSlot[] {
    return this.findByStatus(VisitStatus.ACCEPTED);
  }

  public findUpcomingVisits(): VisitSlot[] {
    const now = new Date();
    return Array.from(this.db.visitSlots.values()).filter(
      v => v.status === VisitStatus.ACCEPTED && v.proposedFor > now
    );
  }
}
