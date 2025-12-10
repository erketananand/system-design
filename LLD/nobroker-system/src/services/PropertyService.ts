import { Property } from '../models/Property';
import { Address } from '../models/Address';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { AddressRepository } from '../repositories/AddressRepository';
import { PropertyFactory, PropertyInput } from '../factories/PropertyFactory';
import { Amenity } from '../enums/Amenity';

export class PropertyService {
  private propertyRepo = new PropertyRepository();
  private addressRepo = new AddressRepository();

  public createProperty(propertyInput: PropertyInput): Property {
    // Save address first
    this.addressRepo.save(propertyInput.address);

    const property = PropertyFactory.createProperty(propertyInput);
    return this.propertyRepo.save(property);
  }

  public getPropertyById(propertyId: string): Property | undefined {
    return this.propertyRepo.findById(propertyId);
  }

  public getOwnerProperties(ownerId: string): Property[] {
    return this.propertyRepo.findByOwner(ownerId);
  }

  public addAmenity(propertyId: string, amenity: Amenity): void {
    const property = this.propertyRepo.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    property.addAmenity(amenity);
    this.propertyRepo.save(property);
  }

  public removeAmenity(propertyId: string, amenity: Amenity): void {
    const property = this.propertyRepo.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    property.removeAmenity(amenity);
    this.propertyRepo.save(property);
  }

  public setAreaDetails(propertyId: string, carpetArea: number | null, builtUpArea: number | null): void {
    const property = this.propertyRepo.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    property.setAreaDetails(carpetArea, builtUpArea);
    this.propertyRepo.save(property);
  }

  public setFloorDetails(propertyId: string, floorNumber: number, totalFloors: number): void {
    const property = this.propertyRepo.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    property.setFloorDetails(floorNumber, totalFloors);
    this.propertyRepo.save(property);
  }

  public searchPropertiesByCity(city: string): Property[] {
    return this.propertyRepo.findByCity(city);
  }
}
