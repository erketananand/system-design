import { IListingState } from './IListingState';
import { PropertyListing } from '../models/PropertyListing';
import { ListingStatus } from '../enums/ListingStatus';

export class DraftState implements IListingState {
  public publish(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.LIVE;
    if (listing.postedAt === null) {
      listing.postedAt = new Date();
    }
  }

  public pause(listing: PropertyListing): void {
    throw new Error('Cannot pause a draft listing. Publish it first.');
  }

  public close(listing: PropertyListing): void {
    listing.listingStatus = ListingStatus.CLOSED;
  }

  public markUnderDiscussion(listing: PropertyListing): void {
    throw new Error('Cannot mark draft listing as under discussion. Publish it first.');
  }

  public getStateName(): string {
    return 'DRAFT';
  }
}
