import { IRepository } from './IRepository';
import { Notification } from '../models/Notification';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { NotificationType } from '../enums/NotificationType';

export class NotificationRepository implements IRepository<Notification> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Notification | undefined {
    return this.db.notifications.get(id);
  }

  public findAll(): Notification[] {
    return Array.from(this.db.notifications.values());
  }

  public save(notification: Notification): Notification {
    this.db.notifications.set(notification.id, notification);
    return notification;
  }

  public delete(id: string): boolean {
    return this.db.notifications.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.notifications.has(id);
  }

  public count(): number {
    return this.db.notifications.size;
  }

  public clear(): void {
    this.db.notifications.clear();
  }

  // Custom query methods
  public findByUser(userId: string): Notification[] {
    return Array.from(this.db.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  public findUnread(userId: string): Notification[] {
    return Array.from(this.db.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  public findByEvent(eventId: string): Notification[] {
    return Array.from(this.db.notifications.values()).filter(n => n.eventId === eventId);
  }

  public findByType(userId: string, type: NotificationType): Notification[] {
    return Array.from(this.db.notifications.values())
      .filter(n => n.userId === userId && n.type === type);
  }

  public markAllAsRead(userId: string): void {
    Array.from(this.db.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => n.markAsRead());
  }
}
