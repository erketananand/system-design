import { User } from '../models/User';
import { Property } from '../models/Property';
import { Address } from '../models/Address';
import { PropertyListing } from '../models/PropertyListing';
import { ChatThread } from '../models/ChatThread';
import { ChatMessage } from '../models/ChatMessage';
import { VisitSlot } from '../models/VisitSlot';
import { Offer } from '../models/Offer';
import { SearchCriteria } from '../models/SearchCriteria';
import { SavedSearchAlert } from '../models/SavedSearchAlert';
import { Review } from '../models/Review';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Storage Maps
  public users: Map<string, User> = new Map();
  public addresses: Map<string, Address> = new Map();
  public properties: Map<string, Property> = new Map();
  public propertyListings: Map<string, PropertyListing> = new Map();
  public chatThreads: Map<string, ChatThread> = new Map();
  public chatMessages: Map<string, ChatMessage> = new Map();
  public visitSlots: Map<string, VisitSlot> = new Map();
  public offers: Map<string, Offer> = new Map();
  public searchCriteria: Map<string, SearchCriteria> = new Map();
  public savedSearchAlerts: Map<string, SavedSearchAlert> = new Map();
  public reviews: Map<string, Review> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public clearAll(): void {
    this.users.clear();
    this.addresses.clear();
    this.properties.clear();
    this.propertyListings.clear();
    this.chatThreads.clear();
    this.chatMessages.clear();
    this.visitSlots.clear();
    this.offers.clear();
    this.searchCriteria.clear();
    this.savedSearchAlerts.clear();
    this.reviews.clear();
    console.log('[DATABASE] All data cleared');
  }

  public getStats(): Record<string, number> {
    return {
      users: this.users.size,
      addresses: this.addresses.size,
      properties: this.properties.size,
      propertyListings: this.propertyListings.size,
      chatThreads: this.chatThreads.size,
      chatMessages: this.chatMessages.size,
      visitSlots: this.visitSlots.size,
      offers: this.offers.size,
      searchCriteria: this.searchCriteria.size,
      savedSearchAlerts: this.savedSearchAlerts.size,
      reviews: this.reviews.size
    };
  }

  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    console.log('================================================================================');
    Object.entries(stats).forEach(([key, value]) => {
      const label = key.padEnd(20, ' ');
      console.log(`  ${label}: ${value}`);
    });
    console.log('================================================================================\n');
  }

  public getTotalRecords(): number {
    const stats = this.getStats();
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  }

  public exportData(): string {
    return JSON.stringify({
      users: Array.from(this.users.values()),
      addresses: Array.from(this.addresses.values()),
      properties: Array.from(this.properties.values()),
      propertyListings: Array.from(this.propertyListings.values()),
      chatThreads: Array.from(this.chatThreads.values()),
      chatMessages: Array.from(this.chatMessages.values()),
      visitSlots: Array.from(this.visitSlots.values()),
      offers: Array.from(this.offers.values()),
      searchCriteria: Array.from(this.searchCriteria.values()),
      savedSearchAlerts: Array.from(this.savedSearchAlerts.values()),
      reviews: Array.from(this.reviews.values())
    }, null, 2);
  }
}
