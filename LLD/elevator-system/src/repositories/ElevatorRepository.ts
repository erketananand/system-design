import { IRepository } from './IRepository';
import { Elevator } from '../models/Elevator';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { ElevatorState } from '../enums/ElevatorState';

/**
 * Elevator Repository
 * Handles all data operations for Elevator entities
 */
export class ElevatorRepository implements IRepository<Elevator> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Elevator | undefined {
    return this.db.elevators.get(id);
  }

  public findAll(): Elevator[] {
    return Array.from(this.db.elevators.values());
  }

  public save(elevator: Elevator): Elevator {
    this.db.elevators.set(elevator.id, elevator);
    return elevator;
  }

  public delete(id: string): boolean {
    return this.db.elevators.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.elevators.has(id);
  }

  public count(): number {
    return this.db.elevators.size;
  }

  public clear(): void {
    this.db.elevators.clear();
  }

  /**
   * Find all elevators in a specific building
   * @param buildingId - The building ID
   * @returns Array of elevators
   */
  public findByBuildingId(buildingId: string): Elevator[] {
    return Array.from(this.db.elevators.values()).filter(
      e => e.buildingId === buildingId
    );
  }

  /**
   * Find elevator by code within a building
   * @param buildingId - The building ID
   * @param code - The elevator code
   * @returns The elevator or undefined
   */
  public findByBuildingAndCode(buildingId: string, code: string): Elevator | undefined {
    return Array.from(this.db.elevators.values()).find(
      e => e.buildingId === buildingId && e.elevatorCode === code
    );
  }

  /**
   * Find all available (non-maintenance) elevators in a building
   * @param buildingId - The building ID
   * @returns Array of available elevators
   */
  public findAvailableByBuildingId(buildingId: string): Elevator[] {
    return this.findByBuildingId(buildingId).filter(
      e => e.state !== ElevatorState.MAINTENANCE
    );
  }

  /**
   * Find all idle elevators in a building
   * @param buildingId - The building ID
   * @returns Array of idle elevators
   */
  public findIdleByBuildingId(buildingId: string): Elevator[] {
    return this.findByBuildingId(buildingId).filter(
      e => e.state === ElevatorState.IDLE
    );
  }
}
