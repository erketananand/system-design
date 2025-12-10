import { IRepository } from './IRepository';
import { Floor } from '../models/Floor';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class FloorRepository implements IRepository<Floor> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Floor | undefined {
    return this.db.floors.get(id);
  }

  public findAll(): Floor[] {
    return Array.from(this.db.floors.values());
  }

  public save(entity: Floor): Floor {
    this.db.floors.set(entity.id, entity);
    return entity;
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

  // Custom query methods
  public findByFloorNumber(floorNumber: number): Floor | undefined {
    return Array.from(this.db.floors.values()).find(
      f => f.floorNumber === floorNumber
    );
  }

  public findAllSorted(): Floor[] {
    return Array.from(this.db.floors.values()).sort(
      (a, b) => a.floorNumber - b.floorNumber
    );
  }
}
