import { IdGenerator } from '../utils/IdGenerator';
import { TicketStatus } from '../enums/TicketStatus';

export class Ticket {
  public readonly id: string;
  public ticketNumber: string;
  public vehicleId: string;
  public spotId: string;
  public entryGateId: string;
  public exitGateId: string | null;
  public entryTime: Date;
  public exitTime: Date | null;
  public expectedDurationHours: number;
  public actualDurationHours: number | null;
  public status: TicketStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    vehicleId: string,
    spotId: string,
    entryGateId: string,
    expectedDurationHours: number,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.ticketNumber = IdGenerator.generateTicketNumber();
    this.vehicleId = vehicleId;
    this.spotId = spotId;
    this.entryGateId = entryGateId;
    this.exitGateId = null;
    this.entryTime = new Date();
    this.exitTime = null;
    this.expectedDurationHours = expectedDurationHours;
    this.actualDurationHours = null;
    this.status = TicketStatus.OPEN;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public closeTicket(exitGateId: string): void {
    if (this.status !== TicketStatus.OPEN) {
      throw new Error(`Ticket ${this.ticketNumber} is already closed or lost`);
    }
    this.exitTime = new Date();
    this.exitGateId = exitGateId;
    this.actualDurationHours = this.calculateActualDuration();
    this.status = TicketStatus.CLOSED;
    this.update();
  }

  public calculateActualDuration(): number {
    if (!this.exitTime) {
      const now = new Date();
      const durationMs = now.getTime() - this.entryTime.getTime();
      return Math.ceil(durationMs / (1000 * 60 * 60));
    }
    const durationMs = this.exitTime.getTime() - this.entryTime.getTime();
    return Math.ceil(durationMs / (1000 * 60 * 60));
  }

  public isOverstayed(thresholdPercentage: number = 20): boolean {
    const actual = this.actualDurationHours || this.calculateActualDuration();
    const threshold = this.expectedDurationHours * (1 + thresholdPercentage / 100);
    return actual > threshold;
  }

  public markAsLost(): void {
    this.status = TicketStatus.LOST;
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
