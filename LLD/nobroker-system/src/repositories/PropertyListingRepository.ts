import { IRepository } from './IRepository';
import { PropertyListing } from '../models/PropertyListing';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { ListingStatus } from '../enums/ListingStatus';
import { ListingPurpose } from '../enums/ListingPurpose';

export class PropertyListingRepository implements IRepository<PropertyListing> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): PropertyListing | undefined {
    return this.db.propertyListings.get(id);
  }

  public findAll(): PropertyListing[] {
    return Array.from(this.db.propertyListings.values());
  }

  public save(entity: PropertyListing): PropertyListing {
    this.db.propertyListings.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.propertyListings.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.propertyListings.has(id);
  }

  public count(): number {
    return this.db.propertyListings.size;
  }

  public clear(): void {
    this.db.propertyListings.clear();
  }

  // Custom query methods
  public findByOwner(ownerId: string): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(l => l.ownerId === ownerId);
  }

  public findByStatus(status: ListingStatus): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(l => l.listingStatus === status);
  }

  public findByPurpose(purpose: ListingPurpose): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(l => l.listingPurpose === purpose);
  }

  public findLiveListings(): PropertyListing[] {
    return this.findByStatus(ListingStatus.LIVE);
  }

  public findActiveListings(): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(
      l => l.listingStatus === ListingStatus.LIVE || l.listingStatus === ListingStatus.UNDER_DISCUSSION
    );
  }

  public findByProperty(propertyId: string): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(l => l.propertyId === propertyId);
  }

  public findForSale(): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(
      l => (l.listingPurpose === ListingPurpose.SALE || l.listingPurpose === ListingPurpose.BOTH) &&
           l.listingStatus === ListingStatus.LIVE
    );
  }

  public findForRent(): PropertyListing[] {
    return Array.from(this.db.propertyListings.values()).filter(
      l => (l.listingPurpose === ListingPurpose.RENT || l.listingPurpose === ListingPurpose.BOTH) &&
           l.listingStatus === ListingStatus.LIVE
    );
  }
}
