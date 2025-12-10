import { IdGenerator } from '../utils/IdGenerator';
import { PropertyType } from '../enums/PropertyType';
import { StructureType } from '../enums/StructureType';
import { PropertyConfiguration } from '../enums/PropertyConfiguration';
import { PgSharingType } from '../enums/PgSharingType';
import { FurnishingType } from '../enums/FurnishingType';
import { Amenity } from '../enums/Amenity';
import { Address } from './Address';

export class Property {
  public readonly id: string;
  public ownerId: string;
  public title: string;
  public description: string;
  public propertyType: PropertyType;
  public structureType: StructureType | null;
  public configuration: PropertyConfiguration | null;
  public pgSharingType: PgSharingType | null;
  public carpetAreaSqFt: number | null;
  public builtUpAreaSqFt: number | null;
  public address: Address;
  public furnishingType: FurnishingType;
  public propertyAgeYears: number | null;
  public floorNumber: number | null;
  public totalFloors: number | null;
  public parkingAvailable: boolean;
  public amenities: Amenity[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    ownerId: string,
    title: string,
    description: string,
    propertyType: PropertyType,
    address: Address,
    furnishingType: FurnishingType,
    structureType: StructureType | null = null,
    configuration: PropertyConfiguration | null = null,
    pgSharingType: PgSharingType | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generatePropertyId();
    this.ownerId = ownerId;
    this.title = title;
    this.description = description;
    this.propertyType = propertyType;
    this.structureType = structureType;
    this.configuration = configuration;
    this.pgSharingType = pgSharingType;
    this.address = address;
    this.furnishingType = furnishingType;
    this.carpetAreaSqFt = null;
    this.builtUpAreaSqFt = null;
    this.propertyAgeYears = null;
    this.floorNumber = null;
    this.totalFloors = null;
    this.parkingAvailable = false;
    this.amenities = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addAmenity(amenity: Amenity): void {
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
      this.update();
    }
  }

  public removeAmenity(amenity: Amenity): void {
    const index = this.amenities.indexOf(amenity);
    if (index > -1) {
      this.amenities.splice(index, 1);
      this.update();
    }
  }

  public isAmenityAvailable(amenity: Amenity): boolean {
    return this.amenities.includes(amenity);
  }

  public setAreaDetails(carpetArea: number | null, builtUpArea: number | null): void {
    this.carpetAreaSqFt = carpetArea;
    this.builtUpAreaSqFt = builtUpArea;
    this.update();
  }

  public setFloorDetails(floorNumber: number, totalFloors: number): void {
    this.floorNumber = floorNumber;
    this.totalFloors = totalFloors;
    this.update();
  }

  public isPG(): boolean {
    return this.propertyType === PropertyType.PG;
  }

  public isFlat(): boolean {
    return this.propertyType === PropertyType.FLAT;
  }

  public isVilla(): boolean {
    return this.propertyType === PropertyType.VILLA;
  }

  public isLand(): boolean {
    return this.propertyType === PropertyType.LAND;
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
