import { IdGenerator } from '../utils/IdGenerator';
import { VehicleType } from '../enums/VehicleType';

export abstract class Vehicle {
  public readonly id: string;
  public readonly licensePlate: string;
  public readonly type: VehicleType;
  public color: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(licensePlate: string, type: VehicleType, color: string, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.licensePlate = licensePlate;
    this.type = type;
    this.color = color;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public getVehicleInfo(): string {
    return `${this.type} - ${this.licensePlate} (${this.color})`;
  }

  protected update(): void {
    this.updatedAt = new Date();
  }
}
