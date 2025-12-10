import { ISearchStrategy } from './ISearchStrategy';
import { PropertyListing } from '../models/PropertyListing';

export class DateSortStrategy implements ISearchStrategy {
  constructor(private newestFirst: boolean = true) {}

  public sort(listings: PropertyListing[]): PropertyListing[] {
    return [...listings].sort((a, b) => {
      const dateA = a.postedAt?.getTime() || 0;
      const dateB = b.postedAt?.getTime() || 0;
      return this.newestFirst ? dateB - dateA : dateA - dateB;
    });
  }

  public getStrategyName(): string {
    return this.newestFirst ? 'NEWEST_FIRST' : 'OLDEST_FIRST';
  }
}
