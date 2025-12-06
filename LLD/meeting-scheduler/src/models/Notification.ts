import { IdGenerator } from '../utils/IdGenerator';
import { NotificationType } from '../enums/NotificationType';

export class Notification {
  public readonly id: string;
  public userId: string;
  public eventId: string;
  public type: NotificationType;
  public message: string;
  public readonly sentAt: Date;
  public isRead: boolean;

  constructor(userId: string, eventId: string, type: NotificationType, message: string, id?: string) {
    this.id = id || IdGenerator.generateNotificationId();
    this.userId = userId;
    this.eventId = eventId;
    this.type = type;
    this.message = message;
    this.sentAt = new Date();
    this.isRead = false;
  }

  public markAsRead(): void {
    this.isRead = true;
  }

  public send(): void {
    console.log(`[NOTIFICATION] ${this.type} sent to User ${this.userId}: ${this.message}`);
  }

  public getInfo(): string {
    return `[${this.type}] ${this.message} ${this.isRead ? '(Read)' : '(Unread)'}`;
  }
}
