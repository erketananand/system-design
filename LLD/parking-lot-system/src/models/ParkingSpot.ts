import { IdGenerator } from '../utils/IdGenerator';
import { SpotType } from '../enums/SpotType';
import { SpotState } from '../enums/SpotState';
import { AccessibilityLevel } from '../enums/AccessibilityLevel';

export class ParkingSpot {
  public readonly id: string;
  public spotNumber: string;
  public floorId: string;
  public type: SpotType;
  public state: SpotState;
  public accessibilityLevel: AccessibilityLevel;
  public distanceScore: number;
  public currentVehicleId: string | null;
  public currentTicketId: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    spotNumber: string,
    floorId: string,
    type: SpotType,
    accessibilityLevel: AccessibilityLevel,
    distanceScore: number = 50,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.spotNumber = spotNumber;
    this.floorId = floorId;
    this.type = type;
    this.state = SpotState.AVAILABLE;
    this.accessibilityLevel = accessibilityLevel;
    this.distanceScore = distanceScore;
    this.currentVehicleId = null;
    this.currentTicketId = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public assignVehicle(vehicleId: string, ticketId: string): void {
    if (this.state !== SpotState.AVAILABLE) {
      throw new Error(`Spot ${this.spotNumber} is not available`);
    }
    this.currentVehicleId = vehicleId;
    this.currentTicketId = ticketId;
    this.state = SpotState.OCCUPIED;
    this.update();
  }

  public releaseSpot(): void {
    this.currentVehicleId = null;
    this.currentTicketId = null;
    this.state = SpotState.AVAILABLE;
    this.update();
  }

  public isAvailable(): boolean {
    return this.state === SpotState.AVAILABLE;
  }

  public markOutOfService(): void {
    if (this.state === SpotState.OCCUPIED) {
      throw new Error(`Cannot mark occupied spot ${this.spotNumber} as out of service`);
    }
    this.state = SpotState.OUT_OF_SERVICE;
    this.update();
  }

  public markAvailable(): void {
    if (this.state === SpotState.OCCUPIED) {
      throw new Error(`Cannot mark occupied spot ${this.spotNumber} as available`);
    }
    this.state = SpotState.AVAILABLE;
    this.update();
  }

  public reserve(ticketId: string): void {
    if (this.state !== SpotState.AVAILABLE) {
      throw new Error(`Spot ${this.spotNumber} is not available for reservation`);
    }
    this.currentTicketId = ticketId;
    this.state = SpotState.RESERVED;
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
