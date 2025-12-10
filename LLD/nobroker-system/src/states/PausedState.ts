import { IListingState } from './IListingState';
import { PropertyListing } from '../models/PropertyListing';
import { ListingStatus } from '../enums/ListingStatus';

export class PausedState implements IListingState {
  public publish(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.LIVE;
  }

  public pause(listing: PropertyListing): void {
    // Already paused, no action needed
  }

  public close(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.CLOSED;
  }

  public markUnderDiscussion(listing: PropertyListing): void {
    throw new Error('Cannot mark paused listing as under discussion. Resume it first.');
  }

  public getStateName(): string {
    return 'PAUSED';
  }
}
