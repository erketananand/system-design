import { IListingState } from './IListingState';
import { PropertyListing } from '../models/PropertyListing';
import { ListingStatus } from '../enums/ListingStatus';

export class LiveState implements IListingState {
  public publish(listing: PropertyListing): void {
    // Already live, no action needed
  }

  public pause(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.PAUSED;
  }

  public close(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.CLOSED;
  }

  public markUnderDiscussion(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.UNDER_DISCUSSION;
  }

  public getStateName(): string {
    return 'LIVE';
  }
}
