import { VisitSlot } from '../models/VisitSlot';
import { ChatMessage } from '../models/ChatMessage';
import { VisitSlotRepository } from '../repositories/VisitSlotRepository';
import { ChatThreadRepository } from '../repositories/ChatThreadRepository';
import { ChatMessageRepository } from '../repositories/ChatMessageRepository';
import { MessageType } from '../enums/MessageType';

export class VisitService {
  private visitRepo = new VisitSlotRepository();
  private threadRepo = new ChatThreadRepository();
  private messageRepo = new ChatMessageRepository();

  public proposeVisit(threadId: string, proposerId: string, slotTime: Date): VisitSlot {
    const thread = this.threadRepo.findById(threadId);
    if (!thread) {
      throw new Error('Chat thread not found');
    }

    if (!thread.isParticipant(proposerId)) {
      throw new Error('User is not a participant in this thread');
    }

    const visit = new VisitSlot(threadId, proposerId, slotTime);
    this.visitRepo.save(visit);

    // Create system message
    const message = new ChatMessage(
      threadId,
      proposerId,
      `Visit proposed for ${slotTime.toLocaleString()}`,
      MessageType.VISIT_PROPOSAL
    );
    this.messageRepo.save(message);

    // Update thread activity
    thread.updateActivity();
    this.threadRepo.save(thread);

    return visit;
  }

  public acceptVisit(slotId: string, userId: string): void {
    const visit = this.visitRepo.findById(slotId);
    if (!visit) {
      throw new Error('Visit slot not found');
    }

    const thread = this.threadRepo.findById(visit.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    visit.accept(userId);
    this.visitRepo.save(visit);

    // Create system message
    const message = new ChatMessage(
      visit.threadId,
      userId,
      `Visit accepted for ${visit.proposedFor.toLocaleString()}`,
      MessageType.SYSTEM
    );
    this.messageRepo.save(message);
  }

  public rejectVisit(slotId: string, userId: string): void {
    const visit = this.visitRepo.findById(slotId);
    if (!visit) {
      throw new Error('Visit slot not found');
    }

    const thread = this.threadRepo.findById(visit.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    visit.reject(userId);
    this.visitRepo.save(visit);

    // Create system message
    const message = new ChatMessage(
      visit.threadId,
      userId,
      'Visit rejected',
      MessageType.SYSTEM
    );
    this.messageRepo.save(message);
  }

  public cancelVisit(slotId: string, userId: string): void {
    const visit = this.visitRepo.findById(slotId);
    if (!visit) {
      throw new Error('Visit slot not found');
    }

    const thread = this.threadRepo.findById(visit.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    visit.cancel(userId);
    this.visitRepo.save(visit);

    // Create system message
    const message = new ChatMessage(
      visit.threadId,
      userId,
      'Visit cancelled',
      MessageType.SYSTEM
    );
    this.messageRepo.save(message);
  }

  public getThreadVisits(threadId: string): VisitSlot[] {
    return this.visitRepo.findByThread(threadId);
  }

  public getUpcomingVisits(): VisitSlot[] {
    return this.visitRepo.findUpcomingVisits();
  }

  public getUserProposedVisits(userId: string): VisitSlot[] {
    return this.visitRepo.findByProposer(userId);
  }
}
