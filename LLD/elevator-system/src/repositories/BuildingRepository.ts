import { IRepository } from './IRepository';
import { Building } from '../models/Building';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

/**
 * Building Repository
 * Handles all data operations for Building entities
 */
export class BuildingRepository implements IRepository<Building> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Building | undefined {
    return this.db.buildings.get(id);
  }

  public findAll(): Building[] {
    return Array.from(this.db.buildings.values());
  }

  public save(building: Building): Building {
    this.db.buildings.set(building.id, building);
    return building;
  }

  public delete(id: string): boolean {
    return this.db.buildings.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.buildings.has(id);
  }

  public count(): number {
    return this.db.buildings.size;
  }

  public clear(): void {
    this.db.buildings.clear();
  }

  /**
   * Find building by name
   * @param name - The building name
   * @returns The building or undefined
   */
  public findByName(name: string): Building | undefined {
    return Array.from(this.db.buildings.values()).find(b => b.name === name);
  }
}
