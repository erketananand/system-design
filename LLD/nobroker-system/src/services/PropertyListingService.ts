import { PropertyListing } from '../models/PropertyListing';
import { PropertyListingRepository } from '../repositories/PropertyListingRepository';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { ListingFactory, ListingInput } from '../factories/ListingFactory';
import { ListingStatus } from '../enums/ListingStatus';
import { ListingVisibility } from '../enums/ListingVisibility';

export class PropertyListingService {
  private listingRepo = new PropertyListingRepository();
  private propertyRepo = new PropertyRepository();

  public createListing(listingInput: ListingInput): PropertyListing {
    // Verify property exists
    const property = this.propertyRepo.findById(listingInput.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Verify owner matches
    if (property.ownerId !== listingInput.ownerId) {
      throw new Error('Only property owner can create listing');
    }

    const listing = ListingFactory.createListing(listingInput);
    return this.listingRepo.save(listing);
  }

  public getListingById(listingId: string): PropertyListing | undefined {
    return this.listingRepo.findById(listingId);
  }

  public getOwnerListings(ownerId: string): PropertyListing[] {
    return this.listingRepo.findByOwner(ownerId);
  }

  public publishListing(listingId: string): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.publish();
    this.listingRepo.save(listing);
  }

  public pauseListing(listingId: string): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.pause();
    this.listingRepo.save(listing);
  }

  public closeListing(listingId: string): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.close();
    this.listingRepo.save(listing);
  }

  public markUnderDiscussion(listingId: string): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.markUnderDiscussion();
    this.listingRepo.save(listing);
  }

  public updatePrice(listingId: string, newBasePrice: number, newRent?: number): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.updatePrice(newBasePrice, newRent);
    this.listingRepo.save(listing);
  }

  public boostVisibility(listingId: string, level: ListingVisibility): void {
    const listing = this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.boostVisibility(level);
    this.listingRepo.save(listing);
  }

  public getLiveListings(): PropertyListing[] {
    return this.listingRepo.findLiveListings();
  }

  public getActiveListings(): PropertyListing[] {
    return this.listingRepo.findActiveListings();
  }

  public getListingsForSale(): PropertyListing[] {
    return this.listingRepo.findForSale();
  }

  public getListingsForRent(): PropertyListing[] {
    return this.listingRepo.findForRent();
  }
}
