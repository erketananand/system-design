import { Property } from '../models/Property';
import { Address } from '../models/Address';
import { PropertyType } from '../enums/PropertyType';
import { StructureType } from '../enums/StructureType';
import { PropertyConfiguration } from '../enums/PropertyConfiguration';
import { PgSharingType } from '../enums/PgSharingType';
import { FurnishingType } from '../enums/FurnishingType';

export interface PropertyInput {
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  address: Address;
  furnishingType: FurnishingType;
  structureType?: StructureType;
  configuration?: PropertyConfiguration;
  pgSharingType?: PgSharingType;
  carpetAreaSqFt?: number;
  builtUpAreaSqFt?: number;
  propertyAgeYears?: number;
  floorNumber?: number;
  totalFloors?: number;
  parkingAvailable?: boolean;
}

export class PropertyFactory {
  public static createProperty(input: PropertyInput): Property {
    const property = new Property(
      input.ownerId,
      input.title,
      input.description,
      input.propertyType,
      input.address,
      input.furnishingType,
      input.structureType || null,
      input.configuration || null,
      input.pgSharingType || null
    );

    // Set optional fields
    if (input.carpetAreaSqFt !== undefined) {
      property.carpetAreaSqFt = input.carpetAreaSqFt;
    }
    if (input.builtUpAreaSqFt !== undefined) {
      property.builtUpAreaSqFt = input.builtUpAreaSqFt;
    }
    if (input.propertyAgeYears !== undefined) {
      property.propertyAgeYears = input.propertyAgeYears;
    }
    if (input.floorNumber !== undefined && input.totalFloors !== undefined) {
      property.setFloorDetails(input.floorNumber, input.totalFloors);
    }
    if (input.parkingAvailable !== undefined) {
      property.parkingAvailable = input.parkingAvailable;
    }

    return property;
  }

  public static createPG(
    ownerId: string,
    title: string,
    description: string,
    address: Address,
    sharingType: PgSharingType,
    furnishingType: FurnishingType
  ): Property {
    return this.createProperty({
      ownerId,
      title,
      description,
      propertyType: PropertyType.PG,
      address,
      furnishingType,
      structureType: StructureType.PG_HOUSE,
      pgSharingType: sharingType
    });
  }

  public static createFlat(
    ownerId: string,
    title: string,
    description: string,
    address: Address,
    configuration: PropertyConfiguration,
    furnishingType: FurnishingType,
    structureType: StructureType = StructureType.APARTMENT
  ): Property {
    return this.createProperty({
      ownerId,
      title,
      description,
      propertyType: PropertyType.FLAT,
      address,
      furnishingType,
      structureType,
      configuration
    });
  }

  public static createVilla(
    ownerId: string,
    title: string,
    description: string,
    address: Address,
    configuration: PropertyConfiguration,
    furnishingType: FurnishingType
  ): Property {
    return this.createProperty({
      ownerId,
      title,
      description,
      propertyType: PropertyType.VILLA,
      address,
      furnishingType,
      structureType: StructureType.STANDALONE,
      configuration
    });
  }

  public static createLand(
    ownerId: string,
    title: string,
    description: string,
    address: Address,
    areaSqFt: number
  ): Property {
    const property = this.createProperty({
      ownerId,
      title,
      description,
      propertyType: PropertyType.LAND,
      address,
      furnishingType: FurnishingType.UNFURNISHED
    });

    property.carpetAreaSqFt = areaSqFt;
    property.builtUpAreaSqFt = areaSqFt;

    return property;
  }
}
