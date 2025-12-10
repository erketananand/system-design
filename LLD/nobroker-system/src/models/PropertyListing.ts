import { IdGenerator } from '../utils/IdGenerator';
import { ListingPurpose } from '../enums/ListingPurpose';
import { ListingStatus } from '../enums/ListingStatus';
import { ListingVisibility } from '../enums/ListingVisibility';
import { Property } from './Property';

export class PropertyListing {
  public readonly id: string;
  public propertyId: string;
  public ownerId: string;
  public listingPurpose: ListingPurpose;
  public basePrice: number;
  public expectedRent: number | null;
  public securityDeposit: number | null;
  public listingStatus: ListingStatus;
  public visibilityLevel: ListingVisibility;
  public isContactVisible: boolean;
  public postedAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    propertyId: string,
    ownerId: string,
    listingPurpose: ListingPurpose,
    basePrice: number,
    expectedRent: number | null = null,
    securityDeposit: number | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateListingId();
    this.propertyId = propertyId;
    this.ownerId = ownerId;
    this.listingPurpose = listingPurpose;
    this.basePrice = basePrice;
    this.expectedRent = expectedRent;
    this.securityDeposit = securityDeposit;
    this.listingStatus = ListingStatus.DRAFT;
    this.visibilityLevel = ListingVisibility.NORMAL;
    this.isContactVisible = true;
    this.postedAt = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public publish(): void {
    if (this.listingStatus === ListingStatus.DRAFT || this.listingStatus === ListingStatus.PAUSED) {
      this.listingStatus = ListingStatus.LIVE;
      if (this.postedAt === null) {
        this.postedAt = new Date();
      }
      this.update();
    }
  }

  public pause(): void {
    if (this.listingStatus === ListingStatus.LIVE) {
      this.listingStatus = ListingStatus.PAUSED;
      this.update();
    }
  }

  public close(): void {
    this.listingStatus = ListingStatus.CLOSED;
    this.update();
  }

  public markUnderDiscussion(): void {
    if (this.listingStatus === ListingStatus.LIVE) {
      this.listingStatus = ListingStatus.UNDER_DISCUSSION;
      this.update();
    }
  }

  public updatePrice(newBasePrice: number, newRent?: number): void {
    this.basePrice = newBasePrice;
    if (newRent !== undefined) {
      this.expectedRent = newRent;
    }
    this.update();
  }

  public boostVisibility(level: ListingVisibility): void {
    this.visibilityLevel = level;
    this.update();
  }

  public isLive(): boolean {
    return this.listingStatus === ListingStatus.LIVE;
  }

  public isDraft(): boolean {
    return this.listingStatus === ListingStatus.DRAFT;
  }

  public isClosed(): boolean {
    return this.listingStatus === ListingStatus.CLOSED;
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
