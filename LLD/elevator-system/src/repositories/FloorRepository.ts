import { IRepository } from './IRepository';
import { Floor } from '../models/Floor';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

/**
 * Floor Repository
 * Handles all data operations for Floor entities
 */
export class FloorRepository implements IRepository<Floor> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Floor | undefined {
    return this.db.floors.get(id);
  }

  public findAll(): Floor[] {
    return Array.from(this.db.floors.values());
  }

  public save(floor: Floor): Floor {
    this.db.floors.set(floor.id, floor);
    return floor;
  }

  public delete(id: string): boolean {
    return this.db.floors.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.floors.has(id);
  }

  public count(): number {
    return this.db.floors.size;
  }

  public clear(): void {
    this.db.floors.clear();
  }

  /**
   * Find all floors in a specific building
   * @param buildingId - The building ID
   * @returns Array of floors
   */
  public findByBuildingId(buildingId: string): Floor[] {
    return Array.from(this.db.floors.values()).filter(
      f => f.buildingId === buildingId
    );
  }

  /**
   * Find a specific floor by building and floor number
   * @param buildingId - The building ID
   * @param floorNumber - The floor number
   * @returns The floor or undefined
   */
  public findByBuildingAndFloorNumber(buildingId: string, floorNumber: number): Floor | undefined {
    return Array.from(this.db.floors.values()).find(
      f => f.buildingId === buildingId && f.floorNumber === floorNumber
    );
  }
}
