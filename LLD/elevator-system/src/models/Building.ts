import { IdGenerator } from '../utils/IdGenerator';

/**
 * Building Entity
 * Represents a building with multiple floors and elevators
 */
export class Building {
  public readonly id: string;
  public name: string;
  public totalFloors: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, totalFloors: number, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.name = name;
    this.totalFloors = totalFloors;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
