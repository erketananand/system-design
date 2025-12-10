import { IRepository } from './IRepository';
import { Vehicle } from '../models/Vehicle';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { VehicleType } from '../enums/VehicleType';

export class VehicleRepository implements IRepository<Vehicle> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Vehicle | undefined {
    return this.db.vehicles.get(id);
  }

  public findAll(): Vehicle[] {
    return Array.from(this.db.vehicles.values());
  }

  public save(entity: Vehicle): Vehicle {
    this.db.saveVehicle(entity);
    return entity;
  }

  public delete(id: string): boolean {
    const vehicle = this.db.vehicles.get(id);
    if (!vehicle) return false;

    this.db.vehicles.delete(id);
    return true;
  }

  public exists(id: string): boolean {
    return this.db.vehicles.has(id);
  }

  public count(): number {
    return this.db.vehicles.size;
  }

  public clear(): void {
    this.db.vehicles.clear();
  }

  // Custom query methods
  public findByLicensePlate(licensePlate: string): Vehicle | undefined {
    return this.db.getVehicleByLicensePlate(licensePlate);
  }

  public findByType(type: VehicleType): Vehicle[] {
    return Array.from(this.db.vehicles.values()).filter(
      v => v.type === type
    );
  }

  public existsByLicensePlate(licensePlate: string): boolean {
    return this.db.getVehicleByLicensePlate(licensePlate) !== undefined;
  }
}
