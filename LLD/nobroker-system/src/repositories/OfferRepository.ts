import { IRepository } from './IRepository';
import { Offer } from '../models/Offer';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { OfferStatus } from '../enums/OfferStatus';

export class OfferRepository implements IRepository<Offer> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Offer | undefined {
    return this.db.offers.get(id);
  }

  public findAll(): Offer[] {
    return Array.from(this.db.offers.values());
  }

  public save(entity: Offer): Offer {
    this.db.offers.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.offers.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.offers.has(id);
  }

  public count(): number {
    return this.db.offers.size;
  }

  public clear(): void {
    this.db.offers.clear();
  }

  // Custom query methods
  public findByListing(listingId: string): Offer[] {
    return Array.from(this.db.offers.values()).filter(o => o.listingId === listingId);
  }

  public findByThread(threadId: string): Offer[] {
    return Array.from(this.db.offers.values()).filter(o => o.threadId === threadId);
  }

  public findByStatus(status: OfferStatus): Offer[] {
    return Array.from(this.db.offers.values()).filter(o => o.status === status);
  }

  public findActiveByListing(listingId: string): Offer[] {
    return Array.from(this.db.offers.values()).filter(
      o => o.listingId === listingId && o.status === OfferStatus.PENDING
    );
  }

  public findByOfferer(offeredById: string): Offer[] {
    return Array.from(this.db.offers.values()).filter(o => o.offeredById === offeredById);
  }

  public findPendingOffers(): Offer[] {
    return this.findByStatus(OfferStatus.PENDING);
  }

  public findAcceptedOffers(): Offer[] {
    return this.findByStatus(OfferStatus.ACCEPTED);
  }

  public findExpiredOffers(): Offer[] {
    const now = new Date();
    return Array.from(this.db.offers.values()).filter(
      o => o.expiresAt !== null && o.expiresAt < now && o.status === OfferStatus.PENDING
    );
  }
}
