import { IdGenerator } from '../utils/IdGenerator';
import { OfferStatus } from '../enums/OfferStatus';

export class Offer {
  public readonly id: string;
  public threadId: string;
  public listingId: string;
  public offeredById: string;
  public offeredToId: string;
  public amount: number;
  public status: OfferStatus;
  public counterOfferId: string | null;
  public expiresAt: Date | null;
  public readonly createdAt: Date;

  constructor(
    threadId: string,
    listingId: string,
    offeredById: string,
    offeredToId: string,
    amount: number,
    expiresAt: Date | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateOfferId();
    this.threadId = threadId;
    this.listingId = listingId;
    this.offeredById = offeredById;
    this.offeredToId = offeredToId;
    this.amount = amount;
    this.status = OfferStatus.PENDING;
    this.counterOfferId = null;
    this.expiresAt = expiresAt;
    this.createdAt = new Date();
  }

  public accept(): void {
    if (this.status === OfferStatus.PENDING) {
      this.status = OfferStatus.ACCEPTED;
    }
  }

  public reject(): void {
    if (this.status === OfferStatus.PENDING) {
      this.status = OfferStatus.REJECTED;
    }
  }

  public markCountered(counterOfferId: string): void {
    this.status = OfferStatus.COUNTERED;
    this.counterOfferId = counterOfferId;
  }

  public expire(): void {
    if (this.status === OfferStatus.PENDING) {
      this.status = OfferStatus.EXPIRED;
    }
  }

  public isPending(): boolean {
    return this.status === OfferStatus.PENDING;
  }

  public isAccepted(): boolean {
    return this.status === OfferStatus.ACCEPTED;
  }

  public isRejected(): boolean {
    return this.status === OfferStatus.REJECTED;
  }

  public isCountered(): boolean {
    return this.status === OfferStatus.COUNTERED;
  }

  public isExpired(): boolean {
    return this.status === OfferStatus.EXPIRED;
  }

  public hasExpired(): boolean {
    return this.expiresAt !== null && new Date() > this.expiresAt;
  }
}
