import { IdGenerator } from '../utils/IdGenerator';

/**
 * Floor Entity
 * Represents a floor in a building
 */
export class Floor {
  public readonly id: string;
  public buildingId: string;
  public floorNumber: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(buildingId: string, floorNumber: number, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.buildingId = buildingId;
    this.floorNumber = floorNumber;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
