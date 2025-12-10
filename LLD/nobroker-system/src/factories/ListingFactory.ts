import { PropertyListing } from '../models/PropertyListing';
import { ListingPurpose } from '../enums/ListingPurpose';
import { ListingVisibility } from '../enums/ListingVisibility';
import { AccountTier } from '../enums/AccountTier';

export interface ListingInput {
  propertyId: string;
  ownerId: string;
  listingPurpose: ListingPurpose;
  basePrice: number;
  expectedRent?: number;
  securityDeposit?: number;
  visibilityLevel?: ListingVisibility;
  ownerAccountTier?: AccountTier;
}

export class ListingFactory {
  public static createListing(input: ListingInput): PropertyListing {
    const listing = new PropertyListing(
      input.propertyId,
      input.ownerId,
      input.listingPurpose,
      input.basePrice,
      input.expectedRent || null,
      input.securityDeposit || null
    );

    // Set visibility based on account tier
    if (input.ownerAccountTier === AccountTier.PREMIUM) {
      listing.visibilityLevel = input.visibilityLevel || ListingVisibility.BOOSTED;
    } else {
      listing.visibilityLevel = ListingVisibility.NORMAL;
    }

    return listing;
  }

  public static createSaleListing(
    propertyId: string,
    ownerId: string,
    salePrice: number,
    ownerAccountTier?: AccountTier
  ): PropertyListing {
    return this.createListing({
      propertyId,
      ownerId,
      listingPurpose: ListingPurpose.SALE,
      basePrice: salePrice,
      ownerAccountTier
    });
  }

  public static createRentalListing(
    propertyId: string,
    ownerId: string,
    monthlyRent: number,
    securityDeposit: number,
    ownerAccountTier?: AccountTier
  ): PropertyListing {
    return this.createListing({
      propertyId,
      ownerId,
      listingPurpose: ListingPurpose.RENT,
      basePrice: monthlyRent,
      expectedRent: monthlyRent,
      securityDeposit,
      ownerAccountTier
    });
  }

  public static createBothListing(
    propertyId: string,
    ownerId: string,
    salePrice: number,
    monthlyRent: number,
    securityDeposit: number,
    ownerAccountTier?: AccountTier
  ): PropertyListing {
    return this.createListing({
      propertyId,
      ownerId,
      listingPurpose: ListingPurpose.BOTH,
      basePrice: salePrice,
      expectedRent: monthlyRent,
      securityDeposit,
      ownerAccountTier
    });
  }
}
