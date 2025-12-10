import { IRepository } from './IRepository';
import { Property } from '../models/Property';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { PropertyType } from '../enums/PropertyType';
import { FurnishingType } from '../enums/FurnishingType';

export class PropertyRepository implements IRepository<Property> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Property | undefined {
    return this.db.properties.get(id);
  }

  public findAll(): Property[] {
    return Array.from(this.db.properties.values());
  }

  public save(entity: Property): Property {
    this.db.properties.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.properties.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.properties.has(id);
  }

  public count(): number {
    return this.db.properties.size;
  }

  public clear(): void {
    this.db.properties.clear();
  }

  // Custom query methods
  public findByOwner(ownerId: string): Property[] {
    return Array.from(this.db.properties.values()).filter(p => p.ownerId === ownerId);
  }

  public findByPropertyType(type: PropertyType): Property[] {
    return Array.from(this.db.properties.values()).filter(p => p.propertyType === type);
  }

  public findByFurnishingType(furnishing: FurnishingType): Property[] {
    return Array.from(this.db.properties.values()).filter(p => p.furnishingType === furnishing);
  }

  public findByCity(city: string): Property[] {
    return Array.from(this.db.properties.values()).filter(
      p => p.address.city.toLowerCase() === city.toLowerCase()
    );
  }

  public findPGProperties(): Property[] {
    return this.findByPropertyType(PropertyType.PG);
  }

  public findFlats(): Property[] {
    return this.findByPropertyType(PropertyType.FLAT);
  }

  public findVillas(): Property[] {
    return this.findByPropertyType(PropertyType.VILLA);
  }

  public findLandProperties(): Property[] {
    return this.findByPropertyType(PropertyType.LAND);
  }
}
