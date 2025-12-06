import { IdGenerator } from '../utils/IdGenerator';
import { NotificationPreference } from './NotificationPreference';

export class User {
  public readonly id: string;
  public name: string;
  public email: string;
  public timezone: string;
  public workingHoursStart: number;
  public workingHoursEnd: number;
  public notificationPreferences: NotificationPreference[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, email: string, timezone: string = 'UTC', id?: string) {
    this.id = id || IdGenerator.generateUserId();
    this.name = name;
    this.email = email;
    this.timezone = timezone;
    this.workingHoursStart = 9;
    this.workingHoursEnd = 17;
    this.notificationPreferences = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public updateWorkingHours(start: number, end: number): void {
    if (start < 0 || start > 23 || end < 0 || end > 23) {
      throw new Error('Working hours must be between 0 and 23');
    }
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    this.workingHoursStart = start;
    this.workingHoursEnd = end;
    this.update();
  }

  public isAvailable(startTime: Date, endTime: Date): boolean {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    return startHour >= this.workingHoursStart && endHour <= this.workingHoursEnd;
  }

  public addNotificationPreference(preference: NotificationPreference): void {
    this.notificationPreferences.push(preference);
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }

  public getInfo(): string {
    return `User: ${this.name} (${this.email}) - Timezone: ${this.timezone}`;
  }
}
