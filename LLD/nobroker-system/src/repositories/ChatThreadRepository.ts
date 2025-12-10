import { IRepository } from './IRepository';
import { ChatThread } from '../models/ChatThread';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class ChatThreadRepository implements IRepository<ChatThread> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): ChatThread | undefined {
    return this.db.chatThreads.get(id);
  }

  public findAll(): ChatThread[] {
    return Array.from(this.db.chatThreads.values());
  }

  public save(entity: ChatThread): ChatThread {
    this.db.chatThreads.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.chatThreads.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.chatThreads.has(id);
  }

  public count(): number {
    return this.db.chatThreads.size;
  }

  public clear(): void {
    this.db.chatThreads.clear();
  }

  // Custom query methods
  public findByListingAndUsers(listingId: string, ownerId: string, seekerId: string): ChatThread | undefined {
    return Array.from(this.db.chatThreads.values()).find(
      t => t.listingId === listingId && t.ownerId === ownerId && t.seekerId === seekerId
    );
  }

  public findByUser(userId: string): ChatThread[] {
    return Array.from(this.db.chatThreads.values()).filter(
      t => t.ownerId === userId || t.seekerId === userId
    );
  }

  public findByListing(listingId: string): ChatThread[] {
    return Array.from(this.db.chatThreads.values()).filter(t => t.listingId === listingId);
  }

  public findActiveThreads(): ChatThread[] {
    return Array.from(this.db.chatThreads.values()).filter(t => t.active);
  }

  public findByOwner(ownerId: string): ChatThread[] {
    return Array.from(this.db.chatThreads.values()).filter(t => t.ownerId === ownerId);
  }

  public findBySeeker(seekerId: string): ChatThread[] {
    return Array.from(this.db.chatThreads.values()).filter(t => t.seekerId === seekerId);
  }
}
