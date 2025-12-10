import { ChatThread } from '../models/ChatThread';
import { ChatMessage } from '../models/ChatMessage';
import { ChatThreadRepository } from '../repositories/ChatThreadRepository';
import { ChatMessageRepository } from '../repositories/ChatMessageRepository';
import { PropertyListingRepository } from '../repositories/PropertyListingRepository';
import { MessageType } from '../enums/MessageType';

export class ChatService {
  private threadRepo = new ChatThreadRepository();
  private messageRepo = new ChatMessageRepository();
  private listingRepo = new PropertyListingRepository();

  public getOrCreateThread(listingId: string, ownerId: string, seekerId: string): ChatThread {
    // Check if listing exists
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Verify owner matches listing
    if (listing.ownerId !== ownerId) {
      throw new Error('Owner ID does not match listing owner');
    }

    // Try to find existing thread
    let thread = this.threadRepo.findByListingAndUsers(listingId, ownerId, seekerId);

    if (!thread) {
      // Create new thread
      thread = new ChatThread(listingId, ownerId, seekerId);
      this.threadRepo.save(thread);

      // Send welcome system message
      const welcomeMsg = new ChatMessage(
        thread.id,
        ownerId,
        'Chat started. Discuss property details, schedule visits, and negotiate offers.',
        MessageType.SYSTEM
      );
      this.messageRepo.save(welcomeMsg);
    }

    return thread;
  }

  public sendTextMessage(threadId: string, senderId: string, content: string): ChatMessage {
    const thread = this.threadRepo.findById(threadId);
    if (!thread) {
      throw new Error('Chat thread not found');
    }

    if (!thread.isParticipant(senderId)) {
      throw new Error('User is not a participant in this thread');
    }

    const message = new ChatMessage(threadId, senderId, content, MessageType.TEXT);
    this.messageRepo.save(message);

    // Update thread activity
    thread.updateActivity();
    this.threadRepo.save(thread);

    return message;
  }

  public getThreadMessages(threadId: string): ChatMessage[] {
    return this.messageRepo.findByThread(threadId);
  }

  public getUserThreads(userId: string): ChatThread[] {
    return this.threadRepo.findByUser(userId);
  }

  public closeThread(threadId: string): void {
    const thread = this.threadRepo.findById(threadId);
    if (!thread) {
      throw new Error('Chat thread not found');
    }

    thread.closeThread();
    this.threadRepo.save(thread);
  }

  public getThreadById(threadId: string): ChatThread | undefined {
    return this.threadRepo.findById(threadId);
  }
}
