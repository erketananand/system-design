import { ISearchStrategy } from './ISearchStrategy';
import { PropertyListing } from '../models/PropertyListing';
import { ListingVisibility } from '../enums/ListingVisibility';

export class RelevanceSortStrategy implements ISearchStrategy {
  public sort(listings: PropertyListing[]): PropertyListing[] {
    return [...listings].sort((a, b) => {
      // Premium listings first
      const visibilityScore = (listing: PropertyListing): number => {
        if (listing.visibilityLevel === ListingVisibility.PREMIUM) return 3;
        if (listing.visibilityLevel === ListingVisibility.BOOSTED) return 2;
        return 1;
      };

      const scoreA = visibilityScore(a);
      const scoreB = visibilityScore(b);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Then by date (newest first)
      const dateA = a.postedAt?.getTime() || 0;
      const dateB = b.postedAt?.getTime() || 0;
      return dateB - dateA;
    });
  }

  public getStrategyName(): string {
    return 'RELEVANCE';
  }
}
