import { PropertyType } from '../enums/PropertyType';
import { PropertyConfiguration } from '../enums/PropertyConfiguration';
import { FurnishingType } from '../enums/FurnishingType';

export class UserPreference {
  public preferredLocations: string[];
  public minBudget: number | null;
  public maxBudget: number | null;
  public preferredPropertyTypes: PropertyType[];
  public preferredConfigurations: PropertyConfiguration[];
  public preferredFurnishingTypes: FurnishingType[];

  constructor(
    preferredLocations: string[] = [],
    minBudget: number | null = null,
    maxBudget: number | null = null,
    preferredPropertyTypes: PropertyType[] = [],
    preferredConfigurations: PropertyConfiguration[] = [],
    preferredFurnishingTypes: FurnishingType[] = []
  ) {
    this.preferredLocations = preferredLocations;
    this.minBudget = minBudget;
    this.maxBudget = maxBudget;
    this.preferredPropertyTypes = preferredPropertyTypes;
    this.preferredConfigurations = preferredConfigurations;
    this.preferredFurnishingTypes = preferredFurnishingTypes;
  }

  public addPreferredLocation(location: string): void {
    if (!this.preferredLocations.includes(location)) {
      this.preferredLocations.push(location);
    }
  }

  public setBudgetRange(min: number | null, max: number | null): void {
    this.minBudget = min;
    this.maxBudget = max;
  }

  public hasPreferences(): boolean {
    return (
      this.preferredLocations.length > 0 ||
      this.minBudget !== null ||
      this.maxBudget !== null ||
      this.preferredPropertyTypes.length > 0 ||
      this.preferredConfigurations.length > 0 ||
      this.preferredFurnishingTypes.length > 0
    );
  }
}
