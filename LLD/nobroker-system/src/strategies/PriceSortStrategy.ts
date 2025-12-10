import { ISearchStrategy } from './ISearchStrategy';
import { PropertyListing } from '../models/PropertyListing';

export class PriceSortStrategy implements ISearchStrategy {
  constructor(private ascending: boolean = true) {}

  public sort(listings: PropertyListing[]): PropertyListing[] {
    return [...listings].sort((a, b) => {
      const priceA = a.expectedRent || a.basePrice;
      const priceB = b.expectedRent || b.basePrice;
      return this.ascending ? priceA - priceB : priceB - priceA;
    });
  }

  public getStrategyName(): string {
    return this.ascending ? 'PRICE_LOW_TO_HIGH' : 'PRICE_HIGH_TO_LOW';
  }
}
