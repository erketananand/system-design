import { IListingState } from './IListingState';
import { PropertyListing } from '../models/PropertyListing';

export class ClosedState implements IListingState {
  public publish(listing: PropertyListing): void {
    throw new Error('Cannot publish a closed listing. Create a new listing instead.');
  }

  public pause(listing: PropertyListing): void {
    throw new Error('Cannot pause a closed listing.');
  }

  public close(listing: PropertyListing): void {
    // Already closed, no action needed
  }

  public markUnderDiscussion(listing: PropertyListing): void {
    throw new Error('Cannot mark closed listing as under discussion.');
  }

  public getStateName(): string {
    return 'CLOSED';
  }
}
