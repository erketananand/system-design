import { PropertyListing } from '../models/PropertyListing';

export interface ISearchStrategy {
  sort(listings: PropertyListing[]): PropertyListing[];
  getStrategyName(): string;
}
