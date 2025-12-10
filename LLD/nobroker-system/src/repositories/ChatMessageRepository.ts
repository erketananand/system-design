import { IRepository } from './IRepository';
import { ChatMessage } from '../models/ChatMessage';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { MessageType } from '../enums/MessageType';

export class ChatMessageRepository implements IRepository<ChatMessage> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): ChatMessage | undefined {
    return this.db.chatMessages.get(id);
  }

  public findAll(): ChatMessage[] {
    return Array.from(this.db.chatMessages.values());
  }

  public save(entity: ChatMessage): ChatMessage {
    this.db.chatMessages.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.chatMessages.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.chatMessages.has(id);
  }

  public count(): number {
    return this.db.chatMessages.size;
  }

  public clear(): void {
    this.db.chatMessages.clear();
  }

  // Custom query methods
  public findByThread(threadId: string): ChatMessage[] {
    return Array.from(this.db.chatMessages.values())
      .filter(m => m.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  public findBySender(senderId: string): ChatMessage[] {
    return Array.from(this.db.chatMessages.values()).filter(m => m.senderId === senderId);
  }

  public findByType(messageType: MessageType): ChatMessage[] {
    return Array.from(this.db.chatMessages.values()).filter(m => m.messageType === messageType);
  }

  public findSystemMessages(): ChatMessage[] {
    return this.findByType(MessageType.SYSTEM);
  }

  public findTextMessages(): ChatMessage[] {
    return this.findByType(MessageType.TEXT);
  }
}
