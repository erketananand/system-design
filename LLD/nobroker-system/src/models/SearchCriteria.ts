import { IdGenerator } from '../utils/IdGenerator';
import { PropertyType } from '../enums/PropertyType';
import { PropertyConfiguration } from '../enums/PropertyConfiguration';
import { FurnishingType } from '../enums/FurnishingType';
import { ListingPurpose } from '../enums/ListingPurpose';
import { Amenity } from '../enums/Amenity';

export class SearchCriteria {
  public readonly id: string;
  public userId: string;
  public name: string;
  public locations: string[];
  public minBudget: number | null;
  public maxBudget: number | null;
  public propertyTypes: PropertyType[];
  public configurations: PropertyConfiguration[];
  public furnishingTypes: FurnishingType[];
  public listingPurposes: ListingPurpose[];
  public requiredAmenities: Amenity[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    userId: string,
    name: string,
    locations: string[] = [],
    minBudget: number | null = null,
    maxBudget: number | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateSearchCriteriaId();
    this.userId = userId;
    this.name = name;
    this.locations = locations;
    this.minBudget = minBudget;
    this.maxBudget = maxBudget;
    this.propertyTypes = [];
    this.configurations = [];
    this.furnishingTypes = [];
    this.listingPurposes = [];
    this.requiredAmenities = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addLocation(location: string): void {
    if (!this.locations.includes(location)) {
      this.locations.push(location);
      this.update();
    }
  }

  public setBudgetRange(min: number | null, max: number | null): void {
    this.minBudget = min;
    this.maxBudget = max;
    this.update();
  }

  public addPropertyType(type: PropertyType): void {
    if (!this.propertyTypes.includes(type)) {
      this.propertyTypes.push(type);
      this.update();
    }
  }

  public addConfiguration(config: PropertyConfiguration): void {
    if (!this.configurations.includes(config)) {
      this.configurations.push(config);
      this.update();
    }
  }

  public addFurnishingType(furnishing: FurnishingType): void {
    if (!this.furnishingTypes.includes(furnishing)) {
      this.furnishingTypes.push(furnishing);
      this.update();
    }
  }

  public addRequiredAmenity(amenity: Amenity): void {
    if (!this.requiredAmenities.includes(amenity)) {
      this.requiredAmenities.push(amenity);
      this.update();
    }
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
