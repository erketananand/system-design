import { IdGenerator } from '../utils/IdGenerator';
import { AlertChannel } from '../enums/AlertChannel';
import { AlertFrequency } from '../enums/AlertFrequency';

export class SavedSearchAlert {
  public readonly id: string;
  public searchCriteriaId: string;
  public userId: string;
  public channel: AlertChannel;
  public frequency: AlertFrequency;
  public lastNotifiedAt: Date | null;
  public active: boolean;
  public readonly createdAt: Date;

  constructor(
    searchCriteriaId: string,
    userId: string,
    channel: AlertChannel = AlertChannel.IN_APP,
    frequency: AlertFrequency = AlertFrequency.INSTANT,
    id?: string
  ) {
    this.id = id || IdGenerator.generateAlertId();
    this.searchCriteriaId = searchCriteriaId;
    this.userId = userId;
    this.channel = channel;
    this.frequency = frequency;
    this.lastNotifiedAt = null;
    this.active = true;
    this.createdAt = new Date();
  }

  public deactivate(): void {
    this.active = false;
  }

  public activate(): void {
    this.active = true;
  }

  public updateLastNotified(): void {
    this.lastNotifiedAt = new Date();
  }

  public shouldNotify(): boolean {
    if (!this.active) {
      return false;
    }

    if (this.frequency === AlertFrequency.INSTANT) {
      return true;
    }

    // Daily frequency check
    if (this.lastNotifiedAt === null) {
      return true;
    }

    const now = new Date();
    const lastNotified = new Date(this.lastNotifiedAt);
    const hoursSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastNotification >= 24;
  }
}
