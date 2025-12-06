import { Notification } from '../models/Notification';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotificationType } from '../enums/NotificationType';
import { Logger } from '../utils/Logger';

export class NotificationService {
  private notificationRepo = new NotificationRepository();
  private userRepo = new UserRepository();

  public sendNotification(userId: string, eventId: string, type: NotificationType, message: string): Notification {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const notification = new Notification(userId, eventId, type, message);
    this.notificationRepo.save(notification);
    notification.send();

    Logger.info(`Notification sent to ${user.name}`);
    return notification;
  }

  public notifyParticipants(userIds: string[], eventId: string, type: NotificationType, message: string): void {
    for (const userId of userIds) {
      try {
        this.sendNotification(userId, eventId, type, message);
      } catch (error) {
        Logger.error(`Failed to send notification to user ${userId}: ${error}`);
      }
    }
  }

  public scheduleReminder(eventId: string, userId: string, minutesBefore: number): void {
    const message = `Reminder: Your event starts in ${minutesBefore} minutes`;
    this.sendNotification(userId, eventId, NotificationType.REMINDER, message);
    Logger.info(`Reminder scheduled for user ${userId}, ${minutesBefore} min before event`);
  }

  public getUnreadNotifications(userId: string): Notification[] {
    return this.notificationRepo.findUnread(userId);
  }

  public getAllNotifications(userId: string): Notification[] {
    return this.notificationRepo.findByUser(userId);
  }

  public markAsRead(notificationId: string): void {
    const notification = this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    notification.markAsRead();
    this.notificationRepo.save(notification);
    Logger.debug(`Notification ${notificationId} marked as read`);
  }

  public markAllAsRead(userId: string): void {
    this.notificationRepo.markAllAsRead(userId);
    Logger.info(`All notifications marked as read for user ${userId}`);
  }

  public getUnreadCount(userId: string): number {
    return this.getUnreadNotifications(userId).length;
  }
}
