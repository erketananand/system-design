import { IRepository } from './IRepository';
import { ParkingSpot } from '../models/ParkingSpot';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { SpotState } from '../enums/SpotState';
import { SpotType } from '../enums/SpotType';
import { AccessibilityLevel } from '../enums/AccessibilityLevel';

export class ParkingSpotRepository implements IRepository<ParkingSpot> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): ParkingSpot | undefined {
    return this.db.parkingSpots.get(id);
  }

  public findAll(): ParkingSpot[] {
    return Array.from(this.db.parkingSpots.values());
  }

  public save(entity: ParkingSpot): ParkingSpot {
    this.db.saveSpot(entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.parkingSpots.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.parkingSpots.has(id);
  }

  public count(): number {
    return this.db.parkingSpots.size;
  }

  public clear(): void {
    this.db.parkingSpots.clear();
  }

  // Custom query methods
  public findByFloorId(floorId: string): ParkingSpot[] {
    return this.db.getSpotsByFloor(floorId);
  }

  public findByState(state: SpotState): ParkingSpot[] {
    return Array.from(this.db.parkingSpots.values()).filter(
      s => s.state === state
    );
  }

  public findAvailableByType(type: SpotType): ParkingSpot[] {
    return Array.from(this.db.parkingSpots.values()).filter(
      s => s.state === SpotState.AVAILABLE && s.type === type
    );
  }

  public findByAccessibilityLevel(level: AccessibilityLevel): ParkingSpot[] {
    return Array.from(this.db.parkingSpots.values()).filter(
      s => s.accessibilityLevel === level && s.state === SpotState.AVAILABLE
    );
  }

  public findByFloorAndState(floorId: string, state: SpotState): ParkingSpot[] {
    return this.db.getSpotsByFloor(floorId).filter(s => s.state === state);
  }

  public countAvailableByFloor(floorId: string): number {
    return this.db.getSpotsByFloor(floorId).filter(
      s => s.state === SpotState.AVAILABLE
    ).length;
  }
}
