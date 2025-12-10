import { PropertyListing } from '../models/PropertyListing';

export interface IListingState {
  publish(listing: PropertyListing): void;
  pause(listing: PropertyListing): void;
  close(listing: PropertyListing): void;
  markUnderDiscussion(listing: PropertyListing): void;
  getStateName(): string;
}
