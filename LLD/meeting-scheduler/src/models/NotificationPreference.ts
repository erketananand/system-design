import { NotificationType } from '../enums/NotificationType';

export class NotificationPreference {
  public userId: string;
  public notificationType: NotificationType;
  public minutesBefore: number;
  public enabled: boolean;

  constructor(userId: string, type: NotificationType, minutesBefore: number) {
    this.userId = userId;
    this.notificationType = type;
    this.minutesBefore = minutesBefore;
    this.enabled = true;
  }

  public toggle(): void {
    this.enabled = !this.enabled;
  }

  public updateMinutes(minutes: number): void {
    if (minutes < 0) throw new Error('Minutes must be non-negative');
    this.minutesBefore = minutes;
  }

  public getInfo(): string {
    return `${this.notificationType} - ${this.minutesBefore}min before - ${this.enabled ? 'Enabled' : 'Disabled'}`;
  }
}
