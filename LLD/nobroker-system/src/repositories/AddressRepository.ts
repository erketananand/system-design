import { IRepository } from './IRepository';
import { Address } from '../models/Address';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class AddressRepository implements IRepository<Address> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Address | undefined {
    return this.db.addresses.get(id);
  }

  public findAll(): Address[] {
    return Array.from(this.db.addresses.values());
  }

  public save(entity: Address): Address {
    this.db.addresses.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.addresses.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.addresses.has(id);
  }

  public count(): number {
    return this.db.addresses.size;
  }

  public clear(): void {
    this.db.addresses.clear();
  }

  // Custom query methods
  public findByCity(city: string): Address[] {
    return Array.from(this.db.addresses.values()).filter(
      a => a.city.toLowerCase() === city.toLowerCase()
    );
  }

  public findByArea(city: string, area: string): Address[] {
    return Array.from(this.db.addresses.values()).filter(
      a => a.city.toLowerCase() === city.toLowerCase() && 
           a.area.toLowerCase() === area.toLowerCase()
    );
  }

  public findByLocality(city: string, area: string, locality: string): Address[] {
    return Array.from(this.db.addresses.values()).filter(
      a => a.city.toLowerCase() === city.toLowerCase() && 
           a.area.toLowerCase() === area.toLowerCase() &&
           a.locality.toLowerCase() === locality.toLowerCase()
    );
  }

  public searchByLocation(location: string): Address[] {
    return Array.from(this.db.addresses.values()).filter(a => a.matchesLocation(location));
  }
}
