import { SavedSearchAlert } from '../models/SavedSearchAlert';
import { PropertyListing } from '../models/PropertyListing';
import { SearchCriteria } from '../models/SearchCriteria';
import { SavedSearchAlertRepository } from '../repositories/SavedSearchAlertRepository';
import { SearchCriteriaRepository } from '../repositories/SearchCriteriaRepository';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { AlertChannel } from '../enums/AlertChannel';
import { AlertFrequency } from '../enums/AlertFrequency';
import { Logger } from '../utils/Logger';

export class AlertService {
  private alertRepo = new SavedSearchAlertRepository();
  private searchCriteriaRepo = new SearchCriteriaRepository();
  private propertyRepo = new PropertyRepository();

  public createAlert(
    criteriaId: string,
    userId: string,
    channel: AlertChannel = AlertChannel.IN_APP,
    frequency: AlertFrequency = AlertFrequency.INSTANT
  ): SavedSearchAlert {
    const criteria = this.searchCriteriaRepo.findById(criteriaId);
    if (!criteria) {
      throw new Error('Search criteria not found');
    }

    if (criteria.userId !== userId) {
      throw new Error('Search criteria does not belong to user');
    }

    const alert = new SavedSearchAlert(criteriaId, userId, channel, frequency);
    return this.alertRepo.save(alert);
  }

  public deactivateAlert(alertId: string): void {
    const alert = this.alertRepo.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.deactivate();
    this.alertRepo.save(alert);
  }

  public activateAlert(alertId: string): void {
    const alert = this.alertRepo.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.activate();
    this.alertRepo.save(alert);
  }

  public getUserAlerts(userId: string): SavedSearchAlert[] {
    return this.alertRepo.findByUser(userId);
  }

  // Observer Pattern: Process new listing and notify matching alerts
  public processNewListing(listing: PropertyListing): void {
    const instantAlerts = this.alertRepo.findInstantAlerts();

    instantAlerts.forEach(alert => {
      if (this.doesListingMatch(listing, alert)) {
        this.notifyUser(alert, [listing]);
        alert.updateLastNotified();
        this.alertRepo.save(alert);
      }
    });
  }

  public processListingUpdate(listing: PropertyListing): void {
    // Similar to processNewListing but for price changes
    this.processNewListing(listing);
  }

  public dispatchPendingAlerts(): void {
    // For daily alerts - would be called by a scheduler
    Logger.info('Dispatching pending daily alerts...');
    // Implementation for batch processing
  }

  private doesListingMatch(listing: PropertyListing, alert: SavedSearchAlert): boolean {
    const criteria = this.searchCriteriaRepo.findById(alert.searchCriteriaId);
    if (!criteria) return false;

    const property = this.propertyRepo.findById(listing.propertyId);
    if (!property) return false;

    // Check locations
    if (criteria.locations.length > 0) {
      const locationMatch = criteria.locations.some(loc => 
        property.address.matchesLocation(loc)
      );
      if (!locationMatch) return false;
    }

    // Check budget
    const price = listing.expectedRent || listing.basePrice;
    if (criteria.minBudget !== null && price < criteria.minBudget) return false;
    if (criteria.maxBudget !== null && price > criteria.maxBudget) return false;

    // Check property type
    if (criteria.propertyTypes.length > 0) {
      if (!criteria.propertyTypes.includes(property.propertyType)) return false;
    }

    // Check configuration
    if (criteria.configurations.length > 0 && property.configuration) {
      if (!criteria.configurations.includes(property.configuration)) return false;
    }

    // Check furnishing
    if (criteria.furnishingTypes.length > 0) {
      if (!criteria.furnishingTypes.includes(property.furnishingType)) return false;
    }

    return true;
  }

  private notifyUser(alert: SavedSearchAlert, listings: PropertyListing[]): void {
    Logger.success(`[ALERT] Notifying user ${alert.userId} via ${alert.channel}`);
    Logger.info(`  Found ${listings.length} matching listing(s)`);
    listings.forEach((listing, idx) => {
      Logger.info(`  ${idx + 1}. Listing ID: ${listing.id} - Price: ₹${listing.basePrice}`);
    });
  }
}
