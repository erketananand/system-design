import { PropertyListing } from '../models/PropertyListing';
import { Property } from '../models/Property';
import { SearchCriteria } from '../models/SearchCriteria';
import { PropertyListingRepository } from '../repositories/PropertyListingRepository';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { SearchCriteriaRepository } from '../repositories/SearchCriteriaRepository';
import { ISearchStrategy } from '../strategies/ISearchStrategy';
import { RelevanceSortStrategy } from '../strategies/RelevanceSortStrategy';
import { ListingStatus } from '../enums/ListingStatus';

export class SearchService {
  private listingRepo = new PropertyListingRepository();
  private propertyRepo = new PropertyRepository();
  private searchCriteriaRepo = new SearchCriteriaRepository();

  public search(criteria: SearchCriteria, strategy?: ISearchStrategy): PropertyListing[] {
    let results = this.listingRepo.findLiveListings();

    // Filter by locations
    if (criteria.locations.length > 0) {
      results = results.filter(listing => {
        const property = this.propertyRepo.findById(listing.propertyId);
        if (!property) return false;
        return criteria.locations.some(loc => 
          property.address.matchesLocation(loc)
        );
      });
    }

    // Filter by budget
    if (criteria.minBudget !== null || criteria.maxBudget !== null) {
      results = results.filter(listing => {
        const price = listing.expectedRent || listing.basePrice;
        if (criteria.minBudget !== null && price < criteria.minBudget) return false;
        if (criteria.maxBudget !== null && price > criteria.maxBudget) return false;
        return true;
      });
    }

    // Filter by property types
    if (criteria.propertyTypes.length > 0) {
      results = results.filter(listing => {
        const property = this.propertyRepo.findById(listing.propertyId);
        if (!property) return false;
        return criteria.propertyTypes.includes(property.propertyType);
      });
    }

    // Filter by configurations
    if (criteria.configurations.length > 0) {
      results = results.filter(listing => {
        const property = this.propertyRepo.findById(listing.propertyId);
        if (!property || !property.configuration) return false;
        return criteria.configurations.includes(property.configuration);
      });
    }

    // Filter by furnishing types
    if (criteria.furnishingTypes.length > 0) {
      results = results.filter(listing => {
        const property = this.propertyRepo.findById(listing.propertyId);
        if (!property) return false;
        return criteria.furnishingTypes.includes(property.furnishingType);
      });
    }

    // Filter by listing purposes
    if (criteria.listingPurposes.length > 0) {
      results = results.filter(listing => 
        criteria.listingPurposes.includes(listing.listingPurpose)
      );
    }

    // Filter by required amenities
    if (criteria.requiredAmenities.length > 0) {
      results = results.filter(listing => {
        const property = this.propertyRepo.findById(listing.propertyId);
        if (!property) return false;
        return criteria.requiredAmenities.every(amenity => 
          property.isAmenityAvailable(amenity)
        );
      });
    }

    // Apply sorting strategy
    const sortStrategy = strategy || new RelevanceSortStrategy();
    return sortStrategy.sort(results);
  }

  public createSearchCriteria(
    userId: string,
    name: string,
    locations: string[],
    minBudget?: number,
    maxBudget?: number
  ): SearchCriteria {
    const criteria = new SearchCriteria(userId, name, locations, minBudget || null, maxBudget || null);
    return this.searchCriteriaRepo.save(criteria);
  }

  public updateSearchCriteria(criteriaId: string, updates: Partial<SearchCriteria>): SearchCriteria {
    const criteria = this.searchCriteriaRepo.findById(criteriaId);
    if (!criteria) {
      throw new Error('Search criteria not found');
    }

    // Apply updates
    Object.assign(criteria, updates);
    return this.searchCriteriaRepo.save(criteria);
  }

  public deleteSearchCriteria(criteriaId: string): boolean {
    return this.searchCriteriaRepo.delete(criteriaId);
  }

  public getUserSavedSearches(userId: string): SearchCriteria[] {
    return this.searchCriteriaRepo.findByUser(userId);
  }

  public getSearchCriteriaById(criteriaId: string): SearchCriteria | undefined {
    return this.searchCriteriaRepo.findById(criteriaId);
  }
}
